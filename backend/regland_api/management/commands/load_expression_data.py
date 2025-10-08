"""
Management command to load gene expression data from TSV file into the database.
Usage: python manage.py load_expression_data
"""
import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from regland_api.models import GeneExpression


class Command(BaseCommand):
    help = 'Load gene expression data from expression_tpm.tsv into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default=None,
            help='Path to the expression TSV file (default: data/expression_tpm.tsv)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=5000,
            help='Number of records to insert per batch (default: 5000)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing expression data before loading',
        )

    def handle(self, *args, **options):
        # Determine file path
        if options['file']:
            file_path = options['file']
        else:
            file_path = os.path.join(settings.BASE_DIR, 'data', 'expression_tpm.tsv')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return
        
        # Clear existing data if requested
        if options['clear']:
            self.stdout.write('Clearing existing expression data...')
            GeneExpression.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data'))
        
        # Load data
        self.stdout.write(f'Loading expression data from {file_path}...')
        
        batch_size = options['batch_size']
        batch = []
        total_count = 0
        skipped_count = 0
        
        try:
            with open(file_path, 'r') as f:
                reader = csv.DictReader(f, delimiter='\t')
                
                for row in reader:
                    try:
                        symbol = row['symbol'].strip()
                        tissue = row['tissue'].strip()
                        tpm = float(row['tpm'])
                        
                        batch.append(GeneExpression(
                            symbol=symbol,
                            tissue=tissue,
                            tpm=tpm
                        ))
                        
                        # Insert batch when it reaches the batch size
                        if len(batch) >= batch_size:
                            with transaction.atomic():
                                GeneExpression.objects.bulk_create(
                                    batch,
                                    ignore_conflicts=True
                                )
                            total_count += len(batch)
                            self.stdout.write(f'Loaded {total_count:,} records...', ending='\r')
                            self.stdout.flush()
                            batch = []
                    
                    except (ValueError, KeyError) as e:
                        skipped_count += 1
                        if skipped_count <= 10:  # Only show first 10 errors
                            self.stdout.write(self.style.WARNING(f'Skipping row due to error: {e}'))
                
                # Insert remaining records
                if batch:
                    with transaction.atomic():
                        GeneExpression.objects.bulk_create(
                            batch,
                            ignore_conflicts=True
                        )
                    total_count += len(batch)
            
            self.stdout.write('\n')
            self.stdout.write(self.style.SUCCESS(
                f'Successfully loaded {total_count:,} expression records'
            ))
            if skipped_count > 0:
                self.stdout.write(self.style.WARNING(f'Skipped {skipped_count} invalid records'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading data: {e}'))
            raise
