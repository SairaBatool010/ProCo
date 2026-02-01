import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
import httpx

from app.api.deps import get_db
from app.models import ChatMessageCreate, ChatMessageRead, IssueRead
from db import ChatMessage, ChatRole, Issue, IssueStatus, Vendor, Property

router = APIRouter(tags=["issues"])


@router.get("/issues", response_model=list[IssueRead])
def list_issues(db: Session = Depends(get_db)):
    return db.query(Issue).order_by(desc(Issue.created_at)).all()


@router.get("/issues/{issue_id}/messages", response_model=list[ChatMessageRead])
def list_issue_messages(issue_id: uuid.UUID, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.issue_id == issue_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    if messages:
        return messages

    # Backfill or return tenant/property messages created before issue_id existed.
    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.issue_id.is_(None),
            ChatMessage.tenant_id == issue.tenant_id,
            ChatMessage.property_id == issue.property_id,
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    if messages:
        db.query(ChatMessage).filter(
            ChatMessage.issue_id.is_(None),
            ChatMessage.tenant_id == issue.tenant_id,
            ChatMessage.property_id == issue.property_id,
        ).update({ChatMessage.issue_id: issue.id})
        db.commit()
    return messages


@router.post("/issues/{issue_id}/messages", response_model=ChatMessageRead)
def create_issue_message(
    issue_id: uuid.UUID, payload: ChatMessageCreate, db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    message = ChatMessage(
        issue_id=issue_id,
        property_id=issue.property_id,
        tenant_id=payload.tenant_id,
        role=ChatRole.LANDLORD,
        content=payload.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.post("/issues/{issue_id}/vendor-request")
async def send_vendor_request(issue_id: uuid.UUID, vendor_id: uuid.UUID, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if vendor is None or not vendor.email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor email not found")

    property_ = db.query(Property).filter(Property.id == issue.property_id).first()
    if property_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    landlord_name = "Unknown Landlord"
    if property_.landlord is not None:
        landlord_name = property_.landlord.name

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            "https://meko27.app.n8n.cloud/webhook-test/74eab492-eeba-48a1-9669-4901608bd2a7",
            json={
                "vendor_email": vendor.email,
                "property_address": property_.address,
                "landlord_name": landlord_name,
                "issue_id": str(issue_id),
            },
        )
    if response.status_code >= 400:
        detail = response.text.strip() or "Vendor webhook request failed"
        raise HTTPException(status_code=502, detail=detail)

    return {"status": "sent"}


@router.patch("/issues/{issue_id}/approve", response_model=IssueRead)
def approve_issue(issue_id: uuid.UUID, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    issue.status = IssueStatus.APPROVED
    db.commit()
    db.refresh(issue)
    return issue


@router.patch("/issues/{issue_id}/reject", response_model=IssueRead)
def reject_issue(issue_id: uuid.UUID, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    issue.status = IssueStatus.REJECTED
    db.commit()
    db.refresh(issue)
    return issue
