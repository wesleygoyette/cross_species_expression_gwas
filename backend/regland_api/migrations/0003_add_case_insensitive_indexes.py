# Generated migration for adding case-insensitive indexes

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('regland_api', '0002_geneexpression'),
    ]

    operations = [
        # Add a case-insensitive index for gene symbol searches
        # This uses SQLite's COLLATE NOCASE feature
        migrations.RunSQL(
            sql=[
                # Create index on UPPER(symbol) for genes table to optimize case-insensitive searches
                "CREATE INDEX IF NOT EXISTS genes_symbol_upper_idx ON genes(UPPER(symbol));",
                
                # Add covering index for gene searches that includes species_id
                "CREATE INDEX IF NOT EXISTS genes_symbol_upper_species_idx ON genes(UPPER(symbol), species_id);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS genes_symbol_upper_idx;",
                "DROP INDEX IF EXISTS genes_symbol_upper_species_idx;",
            ],
        ),
    ]
