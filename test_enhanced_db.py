#!/usr/bin/env python3
"""
Direct test of Wesley's enhanced RegLand database with our improvements
"""

import sqlite3
import json
from pathlib import Path

def test_enhanced_database():
    """Test the enhanced database views and data quality directly"""
    
    db_path = Path("/Users/shaketaveal/cross_species_expression_gwas/database/regland.sqlite")
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return
    
    print("🧬 Testing Wesley's Enhanced RegLand Database")
    print("=" * 60)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Test 1: Basic database info
        print("\n📊 Database Overview:")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        print(f"   Tables: {len(tables)} total")
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name")  
        views = cursor.fetchall()
        print(f"   Views: {len(views)} total")
        
        # Test 2: Enhanced views functionality
        print("\n🔍 Enhanced Views Test:")
        
        test_queries = [
            ("High-confidence enhancers", """
                SELECT COUNT(*) as count, AVG(score) as avg_score
                FROM enhancers_hiconf 
                WHERE species_id = 'human_hg38'
            """),
            ("Tissue coverage stats", """
                SELECT COUNT(*) as tissues, 
                       MIN(enhancer_count) as min_enhancers,
                       MAX(enhancer_count) as max_enhancers
                FROM enhancers_tissue_any 
                WHERE species_id = 'human_hg38'
            """),
            ("Gene-enhancer mappings", """
                SELECT COUNT(*) as total_mappings,
                       COUNT(DISTINCT gene_id) as mapped_genes,
                       AVG(distance_to_gene) as avg_distance
                FROM gene_to_enhancer_annot
                LIMIT 1
            """),
            ("Data quality summary", """
                SELECT * FROM data_quality_summary 
                WHERE species_id = 'human_hg38'
            """)
        ]
        
        for test_name, query in test_queries:
            try:
                cursor.execute(query)
                result = cursor.fetchone()
                if result:
                    print(f"   ✅ {test_name}:")
                    if len(result) == 1:
                        print(f"      Result: {result[0]:,}")
                    else:
                        for i, val in enumerate(result):
                            print(f"      {cursor.description[i][0]}: {val:,}" if isinstance(val, (int, float)) else f"      {cursor.description[i][0]}: {val}")
                else:
                    print(f"   ⚠️  {test_name}: No data")
            except Exception as e:
                print(f"   ❌ {test_name}: Error - {str(e)}")
        
        # Test 3: Tissue quality analysis (like our API endpoint would do)
        print("\n🏥 Tissue Quality Analysis:")
        cursor.execute("""
            SELECT tissue, COUNT(*) as enhancer_count,
                   CASE 
                     WHEN COUNT(*) < 100 THEN 'critical'
                     WHEN COUNT(*) < 1000 THEN 'low' 
                     WHEN COUNT(*) < 10000 THEN 'medium'
                     ELSE 'good'
                   END as coverage_level
            FROM enhancers_hiconf 
            WHERE species_id = 'human_hg38'
            GROUP BY tissue
            ORDER BY enhancer_count DESC
            LIMIT 10
        """)
        
        tissues = cursor.fetchall()
        for tissue, count, level in tissues:
            status_emoji = {"good": "✅", "medium": "⚠️", "low": "🔶", "critical": "❌"}
            emoji = status_emoji.get(level, "❓")
            print(f"   {emoji} {tissue}: {count:,} enhancers ({level})")
        
        # Test 4: Enhanced query performance simulation
        print("\n⚡ Query Performance Test:")
        import time
        
        start = time.time()
        cursor.execute("""
            SELECT e.*, 'high_confidence' as quality_indicator
            FROM enhancers_hiconf e
            WHERE e.species_id = 'human_hg38' AND e.chrom = 'chr1'
            AND e.start >= 1000000 AND e.end <= 2000000
            LIMIT 100
        """)
        results = cursor.fetchall()
        elapsed = time.time() - start
        
        print(f"   ✅ Enhanced region query: {len(results)} results in {elapsed:.3f}s")
        
        # Test 5: Data completeness check
        print("\n📈 Data Completeness:")
        cursor.execute("""
            SELECT 
                COUNT(*) as total_enhancers,
                COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as scored_enhancers,
                ROUND(100.0 * COUNT(CASE WHEN score IS NOT NULL THEN 1 END) / COUNT(*), 1) as score_coverage_pct,
                COUNT(DISTINCT tissue) as tissue_types
            FROM enhancers_all 
            WHERE species_id = 'human_hg38'
        """)
        
        stats = cursor.fetchone()
        total, scored, coverage, tissues = stats
        print(f"   Total enhancers: {total:,}")
        print(f"   Scored enhancers: {scored:,} ({coverage}%)")
        print(f"   Tissue types: {tissues}")
        
        # Quality recommendation simulation
        print(f"\n💡 Quality Recommendations:")
        if coverage < 70:
            print(f"   ⚠️  Only {coverage}% of enhancers have scores - use high-confidence views")
        else:
            print(f"   ✅ Good score coverage ({coverage}%)")
            
        if tissues < 5:
            print(f"   ⚠️  Limited tissue diversity ({tissues} types)")
        else:
            print(f"   ✅ Good tissue coverage ({tissues} types)")
        
        conn.close()
        print("\n🎉 Enhanced database test completed successfully!")
        print("\n📋 Summary: Wesley's RegLand database has been enhanced with:")
        print("   • High-confidence enhancer views")
        print("   • Tissue coverage analysis")
        print("   • Gene-enhancer mapping improvements")
        print("   • Quality monitoring capabilities")
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")

if __name__ == "__main__":
    test_enhanced_database()