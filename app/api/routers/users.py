from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import UserRead
from db import User, UserRole

router = APIRouter(tags=["users"])


@router.get("/users", response_model=list[UserRead])
def list_users(role: UserRole | None = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if role is not None:
        query = query.filter(User.role == role)
    return query.all()


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
