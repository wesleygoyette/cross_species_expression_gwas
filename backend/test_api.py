#!/usr/bin/env python3
"""
Test script for Wesley's enhanced RegLand API endpoints
"""

import requests
import json
import sys

def test_quality_endpoints():
    """Test the enhanced API endpoints we added to Wesley's Django backend"""
    
    base_url = "http://localhost:8000/api"
    
    print("🧬 Testing Wesley's Enhanced RegLand API")
    print("=" * 50)
    
    # Test 1: Data Quality Summary
    try:
        print("\n📊 Testing Data Quality Summary endpoint...")
        response = requests.get(f"{base_url}/quality/summary/?species=human_hg38", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Quality Summary API working!")
            print(f"   Database version: {data.get('database_version', 'unknown')}")
            print(f"   Species: {data.get('species', 'unknown')}")
            
            # Show quality stats
            if 'quality_stats' in data:
                stats = data['quality_stats']
                print("\n   📈 Quality Statistics:")
                for metric, value in stats.items():
                    print(f"      {metric}: {value:,}")
            
            # Show recommendations
            if 'recommendations' in data and data['recommendations']:
                print("\n   ⚠️  Quality Recommendations:")
                for rec in data['recommendations']:
                    print(f"      {rec['severity'].upper()}: {rec['message']}")
        else:
            print(f"❌ Quality Summary failed: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Quality Summary error: {str(e)}")
    
    # Test 2: Enhanced Tissue Info
    try:
        print("\n🧪 Testing Enhanced Tissue Info endpoint...")
        response = requests.get(f"{base_url}/quality/tissues/?species=human_hg38", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Tissue Info API working!")
            print(f"   Total tissues: {data.get('total_tissues', 0)}")
            
            if 'tissues' in data:
                print("\n   🏥 Tissue Coverage:")
                for tissue in data['tissues'][:5]:  # Show first 5
                    coverage = tissue.get('coverage_level', 'unknown')
                    count = tissue.get('enhancer_count', 0)
                    name = tissue.get('tissue', 'unknown')
                    print(f"      {name}: {count:,} enhancers ({coverage})")
        else:
            print(f"❌ Tissue Info failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Tissue Info error: {str(e)}")
    
    # Test 3: Health check 
    try:
        print("\n💚 Testing Health Check endpoint...")
        response = requests.get(f"{base_url}/health/", timeout=5)
        
        if response.status_code == 200:
            print("✅ Health Check API working!")
        else:
            print(f"❌ Health Check failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Health Check error: {str(e)}")

if __name__ == "__main__":
    test_quality_endpoints()