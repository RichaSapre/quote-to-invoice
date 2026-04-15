from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "rep", "manager", "finance"
    created_at = Column(DateTime, default=datetime.utcnow)

class Quote(Base):
    __tablename__ = "quotes"
    id = Column(Integer, primary_key=True, index=True)
    rep_id = Column(Integer, ForeignKey("users.id"))
    customer_name = Column(String, nullable=False)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="draft")
    # status options: draft, pending_approval, approved, rejected, invoiced
    created_at = Column(DateTime, default=datetime.utcnow)
    line_items = relationship("QuoteLineItem", back_populates="quote")
    approvals = relationship("Approval", back_populates="quote")

class QuoteLineItem(Base):
    __tablename__ = "quote_line_items"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    line_total = Column(Float, nullable=False)
    quote = relationship("Quote", back_populates="line_items")

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=True)  # "approved" or "rejected"
    comment = Column(Text, nullable=True)
    actioned_at = Column(DateTime, nullable=True)
    quote = relationship("Quote", back_populates="approvals")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    customer_name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="unpaid")  # unpaid, paid
    created_at = Column(DateTime, default=datetime.utcnow)