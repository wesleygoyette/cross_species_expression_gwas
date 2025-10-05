"""
Management command to migrate data from SQLite to MySQL
"""
import os
import sqlite3
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Migrate data from SQLite database to MySQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sqlite-path',
            type=str,
            default='../database/regland.sqlite',
            help='Path to the SQLite database file'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually doing it'
        )

    def handle(self, *args, **options):
        sqlite_path = options['sqlite_path']
        dry_run = options['dry_run']
        
        # Resolve relative path
        if not os.path.isabs(sqlite_path):
            sqlite_path = os.path.join(settings.BASE_DIR, sqlite_path)
            
        if not os.path.exists(sqlite_path):
            raise CommandError(f'SQLite database not found at: {sqlite_path}')
            
        # Check if we're using MySQL
        if 'mysql' not in settings.DATABASES['default']['ENGINE']:
            raise CommandError('This command only works when MySQL is configured as the database backend')
            
        if dry_run:
            self.stdout.write('DRY RUN - No actual migration will be performed')
            
        try:
            # Connect to SQLite
            sqlite_conn = sqlite3.connect(sqlite_path)
            sqlite_conn.row_factory = sqlite3.Row
            sqlite_cursor = sqlite_conn.cursor()
            
            # Get all tables from SQLite (excluding Django metadata tables)
            sqlite_cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                AND name NOT LIKE 'django_%' 
                AND name NOT LIKE 'auth_%'
                AND name NOT LIKE 'sqlite_%'
            """)
            
            tables = [row[0] for row in sqlite_cursor.fetchall()]
            
            if not tables:
                self.stdout.write('No data tables found in SQLite database')
                return
                
            self.stdout.write(f'Found {len(tables)} data tables to migrate: {", ".join(tables)}')
            
            if dry_run:
                # Just show what would be migrated
                for table in tables:
                    sqlite_cursor.execute(f'SELECT COUNT(*) FROM {table}')
                    count = sqlite_cursor.fetchone()[0]
                    self.stdout.write(f'  - {table}: {count} rows')
            else:
                # Perform actual migration
                with connection.cursor() as mysql_cursor:
                    for table in tables:
                        self.migrate_table(sqlite_cursor, mysql_cursor, table)
                        
            sqlite_conn.close()
            
            if not dry_run:
                self.stdout.write(
                    self.style.SUCCESS('Successfully migrated data from SQLite to MySQL')
                )
                
        except Exception as e:
            raise CommandError(f'Migration failed: {str(e)}') from e
            
    def migrate_table(self, sqlite_cursor, mysql_cursor, table_name):
        """Migrate a single table from SQLite to MySQL"""
        try:
            # Get all data from SQLite table
            sqlite_cursor.execute(f'SELECT * FROM {table_name}')
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                self.stdout.write(f'  - {table_name}: No data to migrate')
                return
                
            # Get column names
            columns = [description[0] for description in sqlite_cursor.description]
            
            # Clear existing data in MySQL table
            mysql_cursor.execute(f'DELETE FROM {table_name}')
            
            # Prepare insert statement
            placeholders = ', '.join(['%s'] * len(columns))
            insert_sql = f'INSERT INTO {table_name} ({", ".join(columns)}) VALUES ({placeholders})'
            
            # Insert data in batches
            batch_size = 1000
            total_rows = len(rows)
            
            for i in range(0, total_rows, batch_size):
                batch = rows[i:i + batch_size]
                mysql_cursor.executemany(insert_sql, [tuple(row) for row in batch])
                
            self.stdout.write(f'  - {table_name}: Migrated {total_rows} rows')
            
        except Exception as e:
            self.stdout.write(
                f'  - {table_name}: Migration failed - {str(e)}'
            )
            raise