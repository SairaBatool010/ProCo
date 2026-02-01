from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import PropertyRead
from db import Property

router = APIRouter(tags=["properties"])


@router.get("/properties", response_model=list[PropertyRead])
def list_properties(db: Session = Depends(get_db)):
    return db.query(Property).all()


@router.get("/properties/{property_id}", response_model=PropertyRead)
def get_property(property_id: str, db: Session = Depends(get_db)):
    property_ = db.get(Property, property_id)
    if not property_:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_
