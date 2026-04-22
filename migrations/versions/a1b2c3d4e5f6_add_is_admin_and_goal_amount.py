"""add_is_admin_and_goal_amount

Revision ID: a1b2c3d4e5f6
Revises: fb689903598a
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '5c4fa4d9dd82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false')
    op.execute('ALTER TABLE profile ADD COLUMN IF NOT EXISTS goal_amount NUMERIC(10,2)')


def downgrade() -> None:
    op.drop_column('users', 'is_admin')
    op.drop_column('profile', 'goal_amount')
