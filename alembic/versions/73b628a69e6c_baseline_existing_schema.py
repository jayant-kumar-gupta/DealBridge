"""baseline existing schema

Revision ID: 73b628a69e6c
Revises: 
Create Date: 2026-10-18 20:57:32.554447

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73b628a69e6c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all baseline tables idempotently without affecting existing data."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if 'category' not in existing_tables:
        op.create_table(
            'category',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('name', sa.String(), nullable=False, unique=True),
            sa.Column('slug', sa.String(), nullable=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('icon', sa.String(), nullable=True),
            sa.Column('product_count', sa.Integer(), server_default='0', nullable=False),
        )
        op.create_index('ix_category_slug', 'category', ['slug'])

    if 'user' not in existing_tables:
        op.create_table(
            'user',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('email', sa.String(), nullable=True),
            sa.Column('phone', sa.String(length=20), nullable=False),
            sa.Column('password', sa.String(), nullable=False),
            sa.Column('firstname', sa.String(), nullable=True),
            sa.Column('lastname', sa.String(), nullable=True),
            sa.Column('is_admin', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('join_date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        )
        op.create_index('ix_user_email', 'user', ['email'], unique=True)
        op.create_index('ix_user_phone', 'user', ['phone'], unique=True)

    if 'partner' not in existing_tables:
        op.create_table(
            'partner',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('name', sa.String(), nullable=False, unique=True),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('website_url', sa.String(), nullable=True, unique=True),
            sa.Column('badge_color', sa.String(), nullable=True),
        )

    if 'tag' not in existing_tables:
        op.create_table(
            'tag',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('name', sa.String(length=50), nullable=False),
        )
        op.create_index('ix_tag_name', 'tag', ['name'], unique=True)

    if 'product' not in existing_tables:
        op.create_table(
            'product',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('slug', sa.String(), nullable=True),
            sa.Column('brand', sa.String(), nullable=True),
            sa.Column('category_id', sa.Integer(), sa.ForeignKey('category.id', ondelete='CASCADE'), nullable=False),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('short_describe', sa.String(), nullable=True),
            sa.Column('image_path', sa.String(), nullable=True),
            sa.Column('our_deal', sa.Float(), nullable=True),
            sa.Column('avg_rating', sa.Float(), server_default='0.0', nullable=False),
            sa.Column('rating_count', sa.Integer(), server_default='0', nullable=False),
        )
        op.create_index('ix_product_name', 'product', ['name'])
        op.create_index('ix_product_slug', 'product', ['slug'])

    if 'rating' not in existing_tables:
        op.create_table(
            'rating',
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('rating', sa.Integer(), nullable=True),
        )

    if 'productcomment' not in existing_tables:
        op.create_table(
            'productcomment',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id', ondelete='CASCADE'), nullable=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=True),
            sa.Column('comment', sa.String(), nullable=True),
            sa.Column('date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        )

    if 'cart' not in existing_tables:
        op.create_table(
            'cart',
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
            sa.Column('partner_id', sa.Integer(), sa.ForeignKey('partner.id', ondelete='CASCADE'), nullable=False),
        )

    if 'partnerprice' not in existing_tables:
        op.create_table(
            'partnerprice',
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('partner_id', sa.Integer(), sa.ForeignKey('partner.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('partner_price', sa.Float(), nullable=False),
            sa.Column('stock_count', sa.Integer(), server_default='0', nullable=True),
            sa.Column('partner_product_url', sa.String(), nullable=True),
            sa.Column('date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        )

    if 'producttag' not in existing_tables:
        op.create_table(
            'producttag',
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('tag_id', sa.Integer(), sa.ForeignKey('tag.id', ondelete='CASCADE'), primary_key=True, nullable=False),
        )

    if 'productspec' not in existing_tables:
        op.create_table(
            'productspec',
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('label', sa.String(length=100), primary_key=True, nullable=False),
            sa.Column('value', sa.String(length=500), nullable=False),
        )

    if 'productpricehistory' not in existing_tables:
        op.create_table(
            'productpricehistory',
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('date', sa.DateTime(), primary_key=True, nullable=False),
            sa.Column('partner_id', sa.Integer(), sa.ForeignKey('partner.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('price', sa.Float(), nullable=False),
        )

    if 'address' not in existing_tables:
        op.create_table(
            'address',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=True),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('phone', sa.String(), nullable=True),
            sa.Column('address_line1', sa.String(), nullable=False),
            sa.Column('address_line2', sa.String(), nullable=True),
            sa.Column('city', sa.String(), nullable=False),
            sa.Column('state', sa.String(), nullable=False),
            sa.Column('pincode', sa.Integer(), nullable=True),
            sa.Column('type', sa.String(), nullable=True),
            sa.Column('isdefault', sa.Boolean(), nullable=False),
        )

    if 'order' not in existing_tables:
        op.create_table(
            'order',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=True),
            sa.Column('address_id', sa.Integer(), sa.ForeignKey('address.id'), nullable=False),
            sa.Column('promocode', sa.String(), nullable=False),
            sa.Column('amount_paid', sa.Float(), nullable=False),
            sa.Column('date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('status', sa.String(), server_default=sa.text("'Active'"), nullable=False),
        )
    else:
        with op.batch_alter_table('order') as batch_op:
            batch_op.alter_column('address_id', existing_type=sa.INTEGER(), nullable=False)

    if 'orderitem' not in existing_tables:
        op.create_table(
            'orderitem',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('order_id', sa.Integer(), sa.ForeignKey('order.id', ondelete='CASCADE'), nullable=False),
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('product.id'), nullable=False),
            sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
            sa.Column('partner_id', sa.Integer(), sa.ForeignKey('partner.id'), nullable=False),
            sa.Column('price', sa.Float(), nullable=False),
        )

    if 'otpverification' not in existing_tables:
        op.create_table(
            'otpverification',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False),
            sa.Column('otp', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('is_used', sa.Boolean(), nullable=False),
            sa.Column('attempts', sa.Integer(), server_default='0', nullable=False),
        )
        op.create_index('ix_otpverification_user_id', 'otpverification', ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if 'order' in existing_tables:
        with op.batch_alter_table('order') as batch_op:
            batch_op.alter_column('address_id', existing_type=sa.INTEGER(), nullable=True)
