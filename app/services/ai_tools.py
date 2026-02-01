from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy.orm import Session

from db import IssueCategory, Vendor, VendorSpecialty


KEYWORD_MAP: dict[IssueCategory, Sequence[str]] = {
    IssueCategory.HEATING: ("heater", "heat", "furnace", "thermostat", "ac"),
    IssueCategory.PLUMBING: ("leak", "pipe", "sink", "toilet", "faucet", "drain"),
    IssueCategory.ELECTRICAL: ("outlet", "breaker", "electric", "power", "light"),
}


def classify_issue(message: str) -> IssueCategory:
    normalized = message.lower()
    for category, keywords in KEYWORD_MAP.items():
        if any(keyword in normalized for keyword in keywords):
            return category
    return IssueCategory.OTHER


def pick_vendor(db: Session, category: IssueCategory) -> Vendor | None:
    specialty_map = {
        IssueCategory.HEATING: VendorSpecialty.HEATING,
        IssueCategory.PLUMBING: VendorSpecialty.PLUMBING,
        IssueCategory.ELECTRICAL: VendorSpecialty.ELECTRICAL,
        IssueCategory.OTHER: VendorSpecialty.GENERAL,
    }
    preferred = specialty_map.get(category, VendorSpecialty.GENERAL)
    vendor = (
        db.query(Vendor)
        .filter(Vendor.specialty == preferred)
        .order_by(Vendor.rating.desc().nullslast())
        .first()
    )
    if vendor is None:
        vendor = db.query(Vendor).order_by(Vendor.rating.desc().nullslast()).first()
    return vendor


def estimate_cost(hourly_rate: float, category: IssueCategory) -> float:
    hours = {
        IssueCategory.HEATING: 2.0,
        IssueCategory.PLUMBING: 1.5,
        IssueCategory.ELECTRICAL: 2.5,
        IssueCategory.OTHER: 1.0,
    }.get(category, 1.0)
    return round(hourly_rate * hours, 2)


def _extract_severity(message: str) -> str:
    lowered = message.lower()
    high_keywords = ("urgent", "emergency", "asap", "flood", "sparking", "gas", "no heat")
    medium_keywords = ("leak", "not working", "broken", "stopped", "no hot water")
    if any(keyword in lowered for keyword in high_keywords):
        return "High"
    if any(keyword in lowered for keyword in medium_keywords):
        return "Medium"
    return "Low"


def _extract_started(message: str) -> str:
    lowered = message.lower()
    for token in ("today", "yesterday", "this morning", "last night", "last week"):
        if token in lowered:
            return token
    if "since" in lowered:
        return "since reported"
    if "for " in lowered and " day" in lowered:
        return "for a few days"
    return "Unknown"


def build_summary(message: str, category: IssueCategory) -> str:
    truncated = (message[:180] + "...") if len(message) > 180 else message
    severity = _extract_severity(message)
    started = _extract_started(message)
    return (
        f"{category.value.title()} issue. "
        f"Tenant report: {truncated} "
        f"Started: {started}. "
        f"Severity: {severity}."
    )
