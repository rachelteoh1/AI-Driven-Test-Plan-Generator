"""Add optimization fields and dashboard table

Revision ID: cd356a7d1e51
Revises: 
Create Date: 2025-06-10 12:34:36.943471
"""
from typing import Sequence, Union
from sqlalchemy import inspect
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'cd356a7d1e51'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    if 'dashboard' not in inspector.get_table_names():
        op.create_table(
            'dashboard',
            sa.Column('id', sa.UUID(), primary_key=True),
            sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id')),
            sa.Column('total_test_plans', sa.Integer(), nullable=True),
            sa.Column('total_commands_generated', sa.Integer(), nullable=True),
            sa.Column('estimated_minutes_saved', sa.Float(), nullable=True),
            sa.Column('most_used_device', sa.String(), nullable=True),
            sa.Column('month', sa.String(), nullable=True),
        )


    # Optionally: Add new fields to existing tables here if needed
    # op.add_column('users', sa.Column('new_field', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove the dashboard table if rolling back
    op.drop_table('dashboard')
