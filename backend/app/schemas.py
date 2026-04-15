from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    role: str

class UserOut(BaseModel):
    id: int
    name: str
    role: str
    class Config:
        from_attributes = True

class LineItemCreate(BaseModel):
    product_name: str
    quantity: int
    unit_price: float

class LineItemOut(BaseModel):
    id: int
    product_name: str
    quantity: int
    unit_price: float
    line_total: float
    class Config:
        from_attributes = True

class QuoteCreate(BaseModel):
    rep_id: int
    customer_name: str

class QuoteOut(BaseModel):
    id: int
    rep_id: int
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime
    line_items: List[LineItemOut] = []
    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    approver_id: int
    action: str  # "approved" or "rejected"
    comment: Optional[str] = None

class InvoiceOut(BaseModel):
    id: int
    quote_id: int
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime
    class Config:
        from_attributes = True