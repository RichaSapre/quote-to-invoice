from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from . import models, schemas
from .database import get_db

router = APIRouter()

APPROVAL_THRESHOLD = 10000.0

# --- USERS ---

@router.post("/users", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(name=user.name, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# --- QUOTES ---

@router.post("/quotes", response_model=schemas.QuoteOut)
def create_quote(quote: schemas.QuoteCreate, db: Session = Depends(get_db)):
    rep = db.query(models.User).filter(
        models.User.id == quote.rep_id,
        models.User.role == "rep"
    ).first()
    if not rep:
        rep = db.query(models.User).filter(models.User.role == "rep").first()
    if not rep:
        raise HTTPException(status_code=400, detail="No sales rep is configured")

    db_quote = models.Quote(rep_id=rep.id, customer_name=quote.customer_name)
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.get("/quotes", response_model=list[schemas.QuoteOut])
def get_quotes(db: Session = Depends(get_db)):
    return db.query(models.Quote).all()

@router.get("/quotes/{quote_id}", response_model=schemas.QuoteOut)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote

# --- LINE ITEMS ---

@router.post("/quotes/{quote_id}/line-items", response_model=schemas.LineItemOut)
def add_line_item(quote_id: int, item: schemas.LineItemCreate, db: Session = Depends(get_db)):
    quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    line_total = item.quantity * item.unit_price
    db_item = models.QuoteLineItem(
        quote_id=quote_id,
        product_name=item.product_name,
        quantity=item.quantity,
        unit_price=item.unit_price,
        line_total=line_total
    )
    db.add(db_item)
    quote.total_amount += line_total
    db.commit()
    db.refresh(db_item)
    return db_item

# --- SUBMIT QUOTE ---

@router.post("/quotes/{quote_id}/submit", response_model=schemas.QuoteOut)
def submit_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft quotes can be submitted")
    if not quote.line_items:
        raise HTTPException(status_code=400, detail="Add at least one line item before submitting")
    if quote.total_amount >= APPROVAL_THRESHOLD:
        quote.status = "pending_approval"
        manager = db.query(models.User).filter(models.User.role == "manager").first()
        if manager:
            approval = models.Approval(quote_id=quote_id, approver_id=manager.id)
            db.add(approval)
        else:
            raise HTTPException(status_code=400, detail="No manager is configured for approvals")
    else:
        quote.status = "approved"
        _generate_invoice(quote, db)
    db.commit()
    db.refresh(quote)
    return quote

# --- APPROVALS ---

@router.get("/approvals/pending")
def get_pending_approvals(db: Session = Depends(get_db)):
    pending = db.query(models.Approval).filter(models.Approval.action == None).all()
    result = []
    for a in pending:
        quote = db.query(models.Quote).filter(models.Quote.id == a.quote_id).first()
        result.append({
            "approval_id": a.id,
            "quote_id": a.quote_id,
            "customer_name": quote.customer_name,
            "total_amount": quote.total_amount,
            "approver_id": a.approver_id
        })
    return result

@router.post("/approvals/{approval_id}/action")
def action_approval(approval_id: int, body: schemas.ApprovalAction, db: Session = Depends(get_db)):
    approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.action is not None:
        raise HTTPException(status_code=400, detail="Already actioned")
    if approval.approver_id != body.approver_id:
        raise HTTPException(status_code=403, detail="Approval assigned to a different manager")
    approval.action = body.action
    approval.comment = body.comment
    approval.actioned_at = datetime.utcnow()
    quote = db.query(models.Quote).filter(models.Quote.id == approval.quote_id).first()
    if body.action == "approved":
        quote.status = "approved"
        _generate_invoice(quote, db)
    else:
        quote.status = "rejected"
    db.commit()
    return {"message": f"Quote {body.action}"}

# --- INVOICES ---

@router.get("/invoices", response_model=list[schemas.InvoiceOut])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(models.Invoice).all()

# --- HELPER ---

def _generate_invoice(quote, db):
    invoice = models.Invoice(
        quote_id=quote.id,
        customer_name=quote.customer_name,
        total_amount=quote.total_amount
    )
    quote.status = "invoiced"
    db.add(invoice)
