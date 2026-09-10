"""drop telegram_chat_id from users

Revision ID: e4f1a2b3c5d6
Revises: dbc197f185d2
Create Date: 2026-09-10 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e4f1a2b3c5d6'
down_revision: Union[str, Sequence[str], None] = 'dbc197f185d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('users', 'telegram_chat_id')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('telegram_chat_id', sa.String(length=50), nullable=True))
