"""drop login column from users

Revision ID: 9e75d1b0e38f
Revises: 60fcc495a3e7
Create Date: 2026-03-31 23:02:40.335130

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e75d1b0e38f'
down_revision: Union[str, Sequence[str], None] = '60fcc495a3e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='users' AND column_name='login'"
    ))
    if result.fetchone():
        op.drop_column('users', 'login')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('login', sa.String(), nullable=False))
