"""create marked price column on partner price table

Revision ID: f885a7450654
Revises: 3fd15b378473
Create Date: 2026-10-18 22:36:24.078519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f885a7450654'
down_revision: Union[str, Sequence[str], None] = '3fd15b378473'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("partnerprice",
                  sa.Column("marked_price", sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("partnerprice", "marked_price")
