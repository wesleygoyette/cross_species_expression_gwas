from django.urls import path
from . import views

urlpatterns = [
    # Gene and region endpoints
    path('genes/search/', views.gene_search, name='gene_search'),
    path('genes/region/', views.gene_region_data, name='gene_region_data'),
    path('genes/combined-data/', views.combined_gene_data, name='combined_gene_data'),
    path('genes/presets/', views.gene_presets, name='gene_presets'),

    # Data endpoints
    path('species/', views.species_list, name='species_list'),
    path('gwas/categories/', views.gwas_categories, name='gwas_categories'),
    
    # Analysis endpoints
    path('analysis/ctcf/', views.ctcf_analysis, name='ctcf_analysis'),
    
    # Export endpoints
    path('export/', views.export_data, name='export_data'),
    
    # Health check
    path('health/', views.health_check, name='health_check'),
]