import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import WalletBalanceUpdate, WalletSummary, WalletTopupRequest
from db import Issue, IssueStatus, Property, PropertyWallet, WalletTransaction

router = APIRouter(tags=["wallets"])


def _get_or_create_wallet(db: Session, property_id: uuid.UUID) -> PropertyWallet:
    wallet = db.query(PropertyWallet).filter(PropertyWallet.property_id == property_id).first()
    if wallet is None:
        wallet = PropertyWallet(property_id=property_id, balance=0)
        db.add(wallet)
        db.flush()
    return wallet


@router.get("/wallets", response_model=list[WalletSummary])
def list_wallets(db: Session = Depends(get_db)):
    wallets = db.query(PropertyWallet).all()
    results: list[WalletSummary] = []
    for wallet in wallets:
        used = (
            db.query(func.coalesce(func.sum(Issue.estimated_cost), 0))
            .filter(
                Issue.property_id == wallet.property_id,
                Issue.status == IssueStatus.APPROVED,
            )
            .scalar()
        )
        used_value = float(used or 0)
        balance_value = float(wallet.balance)
        results.append(
            WalletSummary(
                property_id=wallet.property_id,
                balance=balance_value,
                used=used_value,
                remaining=balance_value - used_value,
            )
        )
    return results


@router.post("/wallets/topup", response_model=WalletSummary)
def topup_wallet(payload: WalletTopupRequest, db: Session = Depends(get_db)):
    property_ = db.query(Property).filter(Property.id == payload.property_id).first()
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    wallet = _get_or_create_wallet(db, payload.property_id)
    wallet.balance = float(wallet.balance) + payload.amount
    db.add(
        WalletTransaction(
            property_id=payload.property_id, amount=payload.amount, note=payload.note
        )
    )
    db.commit()
    db.refresh(wallet)

    used = (
        db.query(func.coalesce(func.sum(Issue.estimated_cost), 0))
        .filter(
            Issue.property_id == wallet.property_id,
            Issue.status == IssueStatus.APPROVED,
        )
        .scalar()
    )
    used_value = float(used or 0)
    balance_value = float(wallet.balance)
    return WalletSummary(
        property_id=wallet.property_id,
        balance=balance_value,
        used=used_value,
        remaining=balance_value - used_value,
    )


@router.patch("/wallets/balance", response_model=WalletSummary)
def update_wallet_balance(payload: WalletBalanceUpdate, db: Session = Depends(get_db)):
    wallet = _get_or_create_wallet(db, payload.property_id)
    wallet.balance = payload.balance
    db.commit()
    db.refresh(wallet)

    used = (
        db.query(func.coalesce(func.sum(Issue.estimated_cost), 0))
        .filter(
            Issue.property_id == wallet.property_id,
            Issue.status == IssueStatus.APPROVED,
        )
        .scalar()
    )
    used_value = float(used or 0)
    balance_value = float(wallet.balance)
    return WalletSummary(
        property_id=wallet.property_id,
        balance=balance_value,
        used=used_value,
        remaining=balance_value - used_value,
    )
