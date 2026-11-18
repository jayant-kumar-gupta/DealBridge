"""add column marked price to product table

Revision ID: 3fd15b378473
Revises: 73b628a69e6c
Create Date: 2026-10-18 21:48:32.673686

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fd15b378473'
down_revision: Union[str, Sequence[str], None] = '73b628a69e6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = {c['name'] for c in inspector.get_columns('product')}
    if 'marked_price' not in cols:
        op.add_column('product', sa.Column('marked_price', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = {c['name'] for c in inspector.get_columns('product')}
    if 'marked_price' in cols:
        with op.batch_alter_table('product') as batch_op:
            batch_op.drop_column('marked_price')
