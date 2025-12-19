"""Add content and role to chat_logs

Revision ID: 7d5d77902d56
Revises: cd356a7d1e51
Create Date: 2025-06-11 21:25:22.197186

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d5d77902d56'
down_revision: Union[str, None] = 'cd356a7d1e51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('chat_logs', sa.Column('content', sa.Text(), nullable=True))
    op.drop_column('chat_logs', 'user_input')
    op.drop_column('chat_logs', 'llm_response')

def downgrade():
    op.add_column('chat_logs', sa.Column('content', sa.Text(), nullable=True))
    op.drop_column('chat_logs', 'user_input')
    op.drop_column('chat_logs', 'llm_response')

