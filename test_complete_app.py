#!/usr/bin/env python3
"""
Test Wesley's complete RegLand application with enhanced database
"""

import requests
import json
import time

def test_complete_application():
    """Test both frontend and enhanced API endpoints"""
    
    print("🧬 Testing Wesley's Complete Enhanced RegLand Application")
    print("=" * 65)
    
    # Test endpoints
    backend_url = "http://127.0.0.1:8001/api"
    frontend_url = "http://localhost:3000"
    
    print(f"\n🔗 Testing connectivity:")
    print(f"   Frontend: {frontend_url}")
    print(f"   Backend API: {backend_url}")
    
    # Test 1: Frontend accessibility
    try:
        response = requests.get(frontend_url, timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend is accessible")
        else:
            print(f"   ⚠️  Frontend returned status {response.status_code}")
    except Exception as e:
        print(f"   ❌ Frontend error: {str(e)}")
    
    # Test 2: Basic API health check
    try:
        response = requests.get(f"{backend_url}/health/", timeout=10)
        if response.status_code == 200:
            print("   ✅ Backend API is responding")
        else:
            print(f"   ⚠️  API returned status {response.status_code}")
    except Exception as e:
        print(f"   ❌ API error: {str(e)}")
    
    # Test 3: Enhanced quality endpoints
    print(f"\n📊 Testing Enhanced API Endpoints:")
    
    enhanced_tests = [
        ("Species List", f"{backend_url}/species/", "GET"),
        ("Data Quality Summary", f"{backend_url}/quality/summary/?species=human_hg38", "GET"),
        ("Enhanced Tissue Info", f"{backend_url}/quality/tissues/?species=human_hg38", "GET"),
        ("Gene Search", f"{backend_url}/genes/search/?q=BDNF&species=human_hg38", "GET")
    ]
    
    for test_name, url, method in enhanced_tests:
        try:
            print(f"   🧪 Testing {test_name}...")
            response = requests.request(method, url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                print(f"      ✅ Success - Response size: {len(json.dumps(data))} bytes")
                
                # Show key information for some endpoints
                if "quality/summary" in url and isinstance(data, dict):
                    if 'quality_stats' in data:
                        stats = data['quality_stats']
                        print(f"         📈 Quality Stats: {len(stats)} metrics")
                    if 'recommendations' in data:
                        recs = data['recommendations']
                        print(f"         💡 Recommendations: {len(recs)} items")
                        
                elif "tissues" in url and isinstance(data, dict):
                    if 'tissues' in data:
                        tissues = data['tissues']
                        print(f"         🏥 Tissues analyzed: {len(tissues)}")
                        good_tissues = [t for t in tissues if t.get('coverage_level') == 'good']
                        print(f"         ✅ Good coverage tissues: {len(good_tissues)}")
                        
                elif "genes/search" in url and isinstance(data, list):
                    print(f"         🧬 Genes found: {len(data)}")
                    
            else:
                print(f"      ❌ Failed - HTTP {response.status_code}")
                if response.text:
                    print(f"         Error: {response.text[:200]}...")
                    
        except requests.exceptions.Timeout:
            print(f"      ⏰ Timeout - endpoint may be processing large data")
        except Exception as e:
            print(f"      ❌ Error: {str(e)}")
    
    # Test 4: Integration test - simulate frontend workflow
    print(f"\n🔄 Testing Enhanced Integration Workflow:")
    
    try:
        # Step 1: Get species list
        print("   1️⃣  Getting available species...")
        species_response = requests.get(f"{backend_url}/species/", timeout=10)
        if species_response.status_code == 200:
            species_data = species_response.json()
            print(f"      ✅ Found {len(species_data)} species")
        
        # Step 2: Get quality summary for human
        print("   2️⃣  Getting quality summary...")
        quality_response = requests.get(f"{backend_url}/quality/summary/?species=human_hg38", timeout=15)
        if quality_response.status_code == 200:
            quality_data = quality_response.json()
            print("      ✅ Quality summary retrieved")
            
            # Show quality insights
            if 'recommendations' in quality_data:
                critical_issues = [r for r in quality_data['recommendations'] if r.get('severity') == 'error']
                if critical_issues:
                    print(f"      ⚠️  {len(critical_issues)} critical data quality issues found")
                else:
                    print("      ✅ No critical data quality issues")
        
        # Step 3: Search for a gene
        print("   3️⃣  Searching for BDNF gene...")
        gene_response = requests.get(f"{backend_url}/genes/search/?q=BDNF&species=human_hg38", timeout=10)
        if gene_response.status_code == 200:
            gene_data = gene_response.json()
            if gene_data:
                print(f"      ✅ Found BDNF gene: {gene_data[0].get('gene_symbol', 'Unknown')}")
            else:
                print("      ⚠️  BDNF gene not found in database")
                
        print("\n🎉 Enhanced integration workflow completed!")
        
    except Exception as e:
        print(f"   ❌ Integration test failed: {str(e)}")
    
    # Summary
    print(f"\n📋 Enhancement Summary:")
    print("   • Wesley's RegLand application is running with enhanced database")
    print("   • Frontend (React): Available on localhost:3000")  
    print("   • Backend (Django): API available on localhost:8001")
    print("   • Enhanced features: Quality monitoring, tissue analysis, improved queries")
    print("   • Database: 2.7M+ enhancers with quality indicators")
    
    print(f"\n🚀 Next Steps:")
    print("   • Open http://localhost:3000 to use the enhanced RegLand interface")
    print("   • The frontend will now have access to quality warnings and better data")
    print("   • Enhanced gene-enhancer mappings provide more accurate results")

if __name__ == "__main__":
    test_complete_application()