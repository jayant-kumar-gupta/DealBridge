from fastapi import APIRouter, status, HTTPException, Response, Depends
from typing import List
from app.core.database import SessionDep
from sqlmodel import select, func
from app.models.database import User, Partner
from app.api.v1.endpoints.user_auth import require_admin
from app.schemas.partners import PartnerCreate, PartnerRead

router = APIRouter(prefix="/partners", tags=["partner"])

# Create Partner
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PartnerRead)
def create_partner(partner_detail: PartnerCreate, session: SessionDep, current_user: User = Depends(require_admin)) -> Partner:

    partner = Partner(
        name=partner_detail.name,
        description=partner_detail.description,
        website_url=partner_detail.website_url,
        badge_color=partner_detail.badge_color,
    )

    session.add(partner)
    session.commit()
    session.refresh(partner)
    return partner

# Read Partner
@router.get("/", response_model=List[PartnerRead])
def get_partners(session: SessionDep, name: str | None = None) -> List[Partner]:
    statement = select(Partner)
    if name:
        statement = statement.where(func.lower(Partner.name).like(f"%{name.lower()}%"))

    partners = session.exec(statement).all()

    return list(partners)

# Read Partner By ID
@router.get("/{id}", response_model=PartnerRead)
def get_partner_by_id(session: SessionDep, id: int) -> Partner:
    partner = session.get(Partner, id)

    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No match for partner with that id!")

    return partner

# Delete Partner
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_partner(session: SessionDep, id: int, current_user: User = Depends(require_admin)):
    partner = session.get(Partner, id)
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No match for partner with that id!")
    session.delete(partner)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Update Partner
@router.put("/{id}", response_model=PartnerRead)
def update_partner(partner_detail: PartnerCreate, session: SessionDep, id: int, current_user: User = Depends(require_admin)):
    partner = session.get(Partner, id)
    if not partner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No match for partner with that id!")

    partner.name = partner_detail.name
    partner.description = partner_detail.description
    partner.website_url = partner_detail.website_url
    partner.badge_color = partner_detail.badge_color

    session.add(partner)
    session.commit()
    session.refresh(partner)

    return partner