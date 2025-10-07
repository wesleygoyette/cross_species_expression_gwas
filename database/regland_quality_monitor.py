#!/usr/bin/env python3
"""
RegLand Database Quality Monitor
Comprehensive data quality assessment for Project Alpha
"""

import sqlite3
import pandas as pd
from datetime import datetime
import sys
from pathlib import Path

class RegLandQualityMonitor:
    def __init__(self, db_path):
        """Initialize quality monitor with database connection"""
        self.db_path = Path(db_path)
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database not found: {db_path}")
        
        self.conn = sqlite3.connect(db_path)
        self.report_timestamp = datetime.now()
        
    def run_full_assessment(self):
        """Run complete data quality assessment"""
        print("🔍 RegLand Database Quality Assessment")
        print("=" * 50)
        print(f"Database: {self.db_path}")
        print(f"Timestamp: {self.report_timestamp}")
        print()
        
        # Core assessments
        self.assess_species_integrity()
        self.assess_missing_data_patterns()
        self.assess_data_coverage()
        self.assess_relationship_integrity()
        self.assess_score_distributions()
        self.generate_recommendations()
        
    def assess_species_integrity(self):
        """Check species table vs actual data consistency"""
        print("📊 SPECIES INTEGRITY CHECK")
        print("-" * 30)
        
        # Species in reference table
        species_ref = pd.read_sql("""
            SELECT species_id, name, genome_build 
            FROM species 
            ORDER BY species_id
        """, self.conn)
        
        # Species with actual data
        species_genes = pd.read_sql("""
            SELECT species_id, COUNT(*) as gene_count 
            FROM genes 
            GROUP BY species_id
        """, self.conn)
        
        species_enhancers = pd.read_sql("""
            SELECT species_id, COUNT(*) as enhancer_count 
            FROM enhancers_all 
            GROUP BY species_id
        """, self.conn)
        
        print("Species Reference Table:")
        print(species_ref.to_string(index=False))
        print()
        
        print("Species with Gene Data:")
        print(species_genes.to_string(index=False))
        print()
        
        print("Species with Enhancer Data:")
        print(species_enhancers.to_string(index=False))
        print()
        
        # Check for orphaned species
        all_species = set(species_genes['species_id'].tolist() + species_enhancers['species_id'].tolist())
        ref_species = set(species_ref['species_id'].tolist())
        
        orphaned = all_species - ref_species
        if orphaned:
            print(f"⚠️  ORPHANED SPECIES (data exists but not in species table): {orphaned}")
        else:
            print("✅ All species with data are properly referenced")
        print()
        
    def assess_missing_data_patterns(self):
        """Identify critical missing data patterns"""
        print("🚨 MISSING DATA PATTERNS")
        print("-" * 30)
        
        missing_patterns = [
            ("Gene-Enhancer Methods", "SELECT COUNT(*) FROM gene_to_enhancer WHERE method IS NULL OR method = ''"),
            ("Gene-Enhancer Distances", "SELECT COUNT(*) FROM gene_to_enhancer WHERE distance_bp IS NULL"),
            ("SNP-Enhancer Overlaps", "SELECT COUNT(*) FROM snp_to_enhancer WHERE overlap_bp IS NULL"),
            ("Enhancer Scores", "SELECT COUNT(*) FROM enhancers_all WHERE score IS NULL"),
            ("Enhancer Tissues", "SELECT COUNT(*) FROM enhancers_all WHERE tissue IS NULL"),
            ("CTCF Motif P-values", "SELECT COUNT(*) FROM ctcf_sites WHERE motif_p IS NULL"),
            ("CTCF Conservation", "SELECT COUNT(*) FROM ctcf_sites WHERE cons_class IS NULL")
        ]
        
        for pattern_name, query in missing_patterns:
            result = self.conn.execute(query).fetchone()[0]
            total_query = query.replace("WHERE", "FROM").split("WHERE")[0].replace("SELECT COUNT(*) FROM", "SELECT COUNT(*) FROM") 
            
            # Get total count for percentage
            table_name = query.split("FROM ")[1].split(" WHERE")[0].strip()
            total = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            
            if total > 0:
                percentage = (result / total) * 100
                status = "🚨" if percentage > 50 else "⚠️ " if percentage > 10 else "✅"
                print(f"{status} {pattern_name}: {result:,} / {total:,} ({percentage:.1f}%)")
            else:
                print(f"❌ {pattern_name}: Table empty")
        print()
        
    def assess_data_coverage(self):
        """Assess data coverage across species and tissues"""
        print("📈 DATA COVERAGE ANALYSIS")
        print("-" * 30)
        
        # Tissue coverage by species
        tissue_coverage = pd.read_sql("""
            SELECT 
                species_id,
                tissue,
                COUNT(*) as enhancer_count
            FROM enhancers_all 
            WHERE tissue IS NOT NULL
            GROUP BY species_id, tissue
            ORDER BY species_id, enhancer_count DESC
        """, self.conn)
        
        if not tissue_coverage.empty:
            print("Tissue Coverage by Species:")
            for species in tissue_coverage['species_id'].unique():
                species_data = tissue_coverage[tissue_coverage['species_id'] == species]
                print(f"\n{species}:")
                for _, row in species_data.iterrows():
                    count = row['enhancer_count']
                    status = "🚨" if count < 1000 else "⚠️ " if count < 10000 else "✅"
                    print(f"  {status} {row['tissue']}: {count:,} enhancers")
        
        # Check for empty critical tables
        empty_tables = []
        critical_tables = ['tad_domains', 'promoters']
        
        for table in critical_tables:
            try:
                count = self.conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                if count == 0:
                    empty_tables.append(table)
            except sqlite3.OperationalError:
                empty_tables.append(f"{table} (table missing)")
        
        if empty_tables:
            print(f"\n❌ EMPTY CRITICAL TABLES: {', '.join(empty_tables)}")
        print()
        
    def assess_relationship_integrity(self):
        """Check referential integrity of relationships"""
        print("🔗 RELATIONSHIP INTEGRITY")
        print("-" * 30)
        
        # Check for orphaned relationships
        integrity_checks = [
            ("Orphaned Gene-Enhancer (genes)", 
             "SELECT COUNT(*) FROM gene_to_enhancer ge LEFT JOIN genes g ON ge.gene_id = g.gene_id WHERE g.gene_id IS NULL"),
            ("Orphaned Gene-Enhancer (enhancers)", 
             "SELECT COUNT(*) FROM gene_to_enhancer ge LEFT JOIN enhancers_all e ON ge.enh_id = e.enh_id WHERE e.enh_id IS NULL"),
            ("Orphaned SNP-Enhancer (SNPs)", 
             "SELECT COUNT(*) FROM snp_to_enhancer se LEFT JOIN gwas_snps s ON se.snp_id = s.snp_id WHERE s.snp_id IS NULL"),
            ("Orphaned SNP-Enhancer (enhancers)", 
             "SELECT COUNT(*) FROM snp_to_enhancer se LEFT JOIN enhancers_all e ON se.enh_id = e.enh_id WHERE e.enh_id IS NULL")
        ]
        
        for check_name, query in integrity_checks:
            result = self.conn.execute(query).fetchone()[0]
            status = "❌" if result > 0 else "✅"
            print(f"{status} {check_name}: {result:,} orphaned records")
        print()
        
    def assess_score_distributions(self):
        """Analyze score distributions and outliers"""
        print("📊 SCORE DISTRIBUTION ANALYSIS")
        print("-" * 30)
        
        # Enhancer scores (using portable median calculation)
        enh_stats = pd.read_sql("""
            WITH ordered AS (
              SELECT score FROM enhancers_all WHERE score IS NOT NULL ORDER BY score
            ),
            cnt AS (
              SELECT COUNT(*) AS c FROM ordered
            )
            SELECT
              (SELECT COUNT(*)          FROM enhancers_all) AS total_enhancers,
              (SELECT COUNT(score)      FROM enhancers_all) AS with_scores,
              (SELECT MIN(score)        FROM enhancers_all) AS min_score,
              (SELECT MAX(score)        FROM enhancers_all) AS max_score,
              (SELECT AVG(score)        FROM enhancers_all) AS avg_score,
              (SELECT AVG(score) FROM (
                  SELECT score FROM ordered
                  LIMIT 2 - (SELECT c % 2 FROM cnt)
                  OFFSET (SELECT (c - 1)/2 FROM cnt)
              )) AS median_score
        """, self.conn)
        
        if not enh_stats.empty:
            row = enh_stats.iloc[0]
            print("Enhancer Scores:")
            print(f"  Total enhancers: {row['total_enhancers']:,}")
            print(f"  With scores: {row['with_scores']:,}")
            if row['with_scores'] > 0:
                print(f"  Range: {row['min_score']:.2f} - {row['max_score']:.2f}")
                print(f"  Average: {row['avg_score']:.2f}")
        
        # CTCF scores  
        ctcf_stats = pd.read_sql("""
            SELECT 
                COUNT(*) as total_sites,
                MIN(score) as min_score,
                MAX(score) as max_score,
                AVG(score) as avg_score
            FROM ctcf_sites
        """, self.conn)
        
        if not ctcf_stats.empty:
            row = ctcf_stats.iloc[0]
            print(f"\nCTCF Scores:")
            print(f"  Total sites: {row['total_sites']:,}")
            print(f"  Range: {row['min_score']:.2f} - {row['max_score']:.2f}")
            print(f"  Average: {row['avg_score']:.2f}")
        print()
        
    def generate_recommendations(self):
        """Generate prioritized recommendations"""
        print("🎯 PRIORITY RECOMMENDATIONS")
        print("-" * 30)
        
        print("IMMEDIATE (This Week):")
        print("1. ✅ Species table integrity (COMPLETED)")
        print("2. 🔧 Backfill gene-enhancer methods with 'unspecified'")
        print("3. 🔧 Create high-confidence data views for analysis")
        print("4. 📊 Implement user warnings for incomplete datasets")
        
        print("\nSHORT TERM (Next Sprint):")
        print("5. 🗃️  Populate promoters table from gene coordinates")
        print("6. 🎨 Standardize enhancer source naming conventions")
        print("7. 📈 Create data quality dashboard for monitoring")
        print("8. 🧪 Develop test suite for data integrity")
        
        print("\nLONG TERM (Next Month):")
        print("9. 🧬 Source and populate TAD domain data")
        print("10. 🔬 Implement CTCF motif p-value calculation")
        print("11. 🌍 Cross-species data validation framework")
        print("12. ⚡ Advanced indexing for performance optimization")
        
        print(f"\n📝 Report generated: {self.report_timestamp}")
        print("🔄 Run this tool regularly to monitor data quality improvements")
        
    def close(self):
        """Clean up database connection"""
        self.conn.close()

def main():
    """Main execution function"""
    if len(sys.argv) != 2:
        print("Usage: python3 regland_quality_monitor.py <path_to_regland.sqlite>")
        sys.exit(1)
    
    db_path = sys.argv[1]
    
    try:
        monitor = RegLandQualityMonitor(db_path)
        monitor.run_full_assessment()
        monitor.close()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()