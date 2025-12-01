"""Add contact fields to empresas table

Revision ID: c9a12b34d567
Revises: f80b2b33a570
Create Date: 2025-12-01 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9a12b34d567'
down_revision: Union[str, None] = 'f80b2b33a570'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'empresas'
    """))
    existing_columns = {row[0] for row in result.fetchall()}
    
    columns_to_add = {
        'nome_contato': 'VARCHAR(200)',
        'cargo_contato': 'VARCHAR(200)',
        'telefone_contato': 'VARCHAR(50)',
        'email_contato': 'VARCHAR(200)',
    }
    
    for column_name, column_type in columns_to_add.items():
        if column_name not in existing_columns:
            op.add_column('empresas', sa.Column(column_name, sa.String(length=200 if 'nome' in column_name or 'cargo' in column_name or 'email' in column_name else 50), nullable=True))
    
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'prospeccoes'
    """))
    prospeccoes_columns = {row[0] for row in result.fetchall()}
    
    prospeccoes_columns_to_add = {
        'codigo': sa.String(50),
        'data_atualizacao': sa.DateTime(),
    }
    
    for column_name, column_type in prospeccoes_columns_to_add.items():
        if column_name not in prospeccoes_columns:
            op.add_column('prospeccoes', sa.Column(column_name, column_type, nullable=True))
    
    if 'codigo' not in prospeccoes_columns:
        try:
            op.create_index('ix_prospeccoes_codigo', 'prospeccoes', ['codigo'], unique=True)
        except Exception:
            pass
    
    result = connection.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'prospeccoes_historico'
    """))
    if result.rowcount == 0:
        op.create_table('prospeccoes_historico',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('prospeccao_id', sa.Integer(), nullable=False),
            sa.Column('usuario_id', sa.Integer(), nullable=False),
            sa.Column('data_alteracao', sa.DateTime(), nullable=False),
            sa.Column('tipo_alteracao', sa.String(length=50), nullable=False),
            sa.Column('campo_alterado', sa.String(length=100), nullable=True),
            sa.Column('valor_anterior', sa.Text(), nullable=True),
            sa.Column('valor_novo', sa.Text(), nullable=True),
            sa.Column('descricao', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['prospeccao_id'], ['prospeccoes.id'], ),
            sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_prospeccoes_historico_id', 'prospeccoes_historico', ['id'], unique=False)


def downgrade() -> None:
    op.drop_column('empresas', 'email_contato')
    op.drop_column('empresas', 'telefone_contato')
    op.drop_column('empresas', 'cargo_contato')
    op.drop_column('empresas', 'nome_contato')
