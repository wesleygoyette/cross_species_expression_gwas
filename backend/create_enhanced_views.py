#!/usr/bin/env python3
"""
Create enhanced database views for Wesley's RegLand SQLite database
"""

import sqlite3
import os
from pathlib import Path

def create_enhanced_views():
    """Create the enhanced views needed for the API endpoints"""
    
    # Path to Wesley's database
    db_path = Path("../database/regland.sqlite")
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return False
    
    print(f"🔧 Creating enhanced views in {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if enhancers_all table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='enhancers_all'")
        if not cursor.fetchone():
            print("⚠️  enhancers_all table not found, creating alias to enhancers table")
            cursor.execute("CREATE VIEW IF NOT EXISTS enhancers_all AS SELECT * FROM enhancers")
        
        print("📊 Creating enhancers_hiconf view (high-confidence enhancers)...")
        cursor.execute("""
            CREATE VIEW IF NOT EXISTS enhancers_hiconf AS
            SELECT * FROM enhancers_all 
            WHERE score IS NOT NULL 
            AND score > 0.5
        """)
        
        print("🧪 Creating enhancers_tissue_any view (tissue-specific analysis)...")
        cursor.execute("""
            CREATE VIEW IF NOT EXISTS enhancers_tissue_any AS
            SELECT species_id, tissue, COUNT(*) as enhancer_count,
                   AVG(CAST(score AS REAL)) as avg_score,
                   MIN(CAST(score AS REAL)) as min_score,
                   MAX(CAST(score AS REAL)) as max_score
            FROM enhancers_all 
            WHERE tissue IS NOT NULL AND score IS NOT NULL
            GROUP BY species_id, tissue
        """)
        
        print("🔗 Checking gene_to_enhancer_annot table...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='gene_to_enhancer_annot'")
        if not cursor.fetchone():
            print("⚠️  gene_to_enhancer_annot table not found, creating basic structure")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS gene_to_enhancer_annot (
                    id INTEGER PRIMARY KEY,
                    gene_id TEXT,
                    enhancer_id TEXT,
                    distance_to_gene INTEGER,
                    mapping_method TEXT DEFAULT 'proximity'
                )
            """)
            
            # Add some basic mappings if the table is empty
            cursor.execute("SELECT COUNT(*) FROM gene_to_enhancer_annot")
            if cursor.fetchone()[0] == 0:
                print("📝 Creating basic gene-enhancer mappings...")
                cursor.execute("""
                    INSERT INTO gene_to_enhancer_annot (gene_id, enhancer_id, distance_to_gene, mapping_method)
                    SELECT g.gene_id, e.enhancer_id, 
                           ABS((g.start + g.end)/2 - (e.start + e.end)/2) as distance,
                           'proximity' as method
                    FROM genes g
                    JOIN enhancers_all e ON g.species_id = e.species_id AND g.chrom = e.chrom
                    WHERE ABS((g.start + g.end)/2 - (e.start + e.end)/2) < 100000
                    LIMIT 10000
                """)
                print(f"   Added {cursor.rowcount} gene-enhancer mappings")
        
        print("📈 Creating summary statistics view...")
        cursor.execute("""
            CREATE VIEW IF NOT EXISTS data_quality_summary AS
            SELECT 
                species_id,
                COUNT(*) as total_enhancers,
                COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as scored_enhancers,
                COUNT(CASE WHEN score IS NOT NULL AND score > 0.5 THEN 1 END) as high_conf_enhancers,
                COUNT(DISTINCT tissue) as tissue_count,
                COUNT(DISTINCT chrom) as chromosome_count
            FROM enhancers_all
            GROUP BY species_id
        """)
        
        conn.commit()
        
        # Test the views
        print("\n✅ Testing created views...")
        
        test_queries = [
            ("enhancers_hiconf", "SELECT COUNT(*) FROM enhancers_hiconf WHERE species_id = 'human_hg38'"),
            ("enhancers_tissue_any", "SELECT COUNT(*) FROM enhancers_tissue_any WHERE species_id = 'human_hg38'"),
            ("gene_to_enhancer_annot", "SELECT COUNT(*) FROM gene_to_enhancer_annot"),
            ("data_quality_summary", "SELECT * FROM data_quality_summary WHERE species_id = 'human_hg38'")
        ]
        
        for view_name, query in test_queries:
            try:
                cursor.execute(query)
                result = cursor.fetchone()
                print(f"   {view_name}: {result[0] if result else 'No data'}")
            except Exception as e:
                print(f"   ❌ {view_name}: Error - {str(e)}")
        
        conn.close()
        print("\n🎉 Enhanced views created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating views: {str(e)}")
        return False

if __name__ == "__main__":
    create_enhanced_views()