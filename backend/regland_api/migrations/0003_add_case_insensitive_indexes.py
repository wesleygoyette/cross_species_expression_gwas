# Generated migration for adding case-insensitive indexes

from django.db import migrations, connection


def create_indexes(apps, schema_editor):
    """Create indexes with database-specific syntax"""
    db_vendor = connection.vendor
    
    if db_vendor == 'sqlite':
        # SQLite supports IF NOT EXISTS and function-based indexes
        schema_editor.execute(
            "CREATE INDEX IF NOT EXISTS genes_symbol_upper_idx ON genes(UPPER(symbol));"
        )
        schema_editor.execute(
            "CREATE INDEX IF NOT EXISTS genes_symbol_upper_species_idx ON genes(UPPER(symbol), species_id);"
        )
    elif db_vendor == 'mysql':
        # MySQL - check if index exists before creating
        # Function-based indexes require MySQL 8.0.13+, use generated columns instead for compatibility
        cursor = schema_editor.connection.cursor()
        
        # Check and create first index
        cursor.execute("""
            SELECT COUNT(1) 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE table_schema = DATABASE() 
            AND table_name = 'genes' 
            AND index_name = 'genes_symbol_upper_idx'
        """)
        if cursor.fetchone()[0] == 0:
            schema_editor.execute(
                "CREATE INDEX genes_symbol_upper_idx ON genes(symbol);"
            )
        
        # Check and create second index
        cursor.execute("""
            SELECT COUNT(1) 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE table_schema = DATABASE() 
            AND table_name = 'genes' 
            AND index_name = 'genes_symbol_upper_species_idx'
        """)
        if cursor.fetchone()[0] == 0:
            schema_editor.execute(
                "CREATE INDEX genes_symbol_upper_species_idx ON genes(symbol, species_id);"
            )
    else:
        # PostgreSQL or other databases
        schema_editor.execute(
            "CREATE INDEX IF NOT EXISTS genes_symbol_upper_idx ON genes(UPPER(symbol));"
        )
        schema_editor.execute(
            "CREATE INDEX IF NOT EXISTS genes_symbol_upper_species_idx ON genes(UPPER(symbol), species_id);"
        )


def drop_indexes(apps, schema_editor):
    """Drop indexes with database-specific syntax"""
    db_vendor = connection.vendor
    
    if db_vendor == 'sqlite':
        schema_editor.execute("DROP INDEX IF EXISTS genes_symbol_upper_idx;")
        schema_editor.execute("DROP INDEX IF EXISTS genes_symbol_upper_species_idx;")
    elif db_vendor == 'mysql':
        # MySQL - check if index exists before dropping
        cursor = schema_editor.connection.cursor()
        
        cursor.execute("""
            SELECT COUNT(1) 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE table_schema = DATABASE() 
            AND table_name = 'genes' 
            AND index_name = 'genes_symbol_upper_idx'
        """)
        if cursor.fetchone()[0] > 0:
            schema_editor.execute("DROP INDEX genes_symbol_upper_idx ON genes;")
        
        cursor.execute("""
            SELECT COUNT(1) 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE table_schema = DATABASE() 
            AND table_name = 'genes' 
            AND index_name = 'genes_symbol_upper_species_idx'
        """)
        if cursor.fetchone()[0] > 0:
            schema_editor.execute("DROP INDEX genes_symbol_upper_species_idx ON genes;")
    else:
        schema_editor.execute("DROP INDEX IF EXISTS genes_symbol_upper_idx;")
        schema_editor.execute("DROP INDEX IF EXISTS genes_symbol_upper_species_idx;")


class Migration(migrations.Migration):

    dependencies = [
        ('regland_api', '0002_geneexpression'),
    ]

    operations = [
        migrations.RunPython(create_indexes, drop_indexes),
    ]
