import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import ChatMessageCreate, ChatMessageRead, IssueRead
from db import ChatMessage, ChatRole, Issue, IssueStatus

router = APIRouter(tags=["issues"])


@router.get("/issues", response_model=list[IssueRead])
def list_issues(db: Session = Depends(get_db)):
    return db.query(Issue).all()


@router.get("/issues/{issue_id}/messages", response_model=list[ChatMessageRead])
def list_issue_messages(issue_id: uuid.UUID, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.issue_id == issue_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


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
