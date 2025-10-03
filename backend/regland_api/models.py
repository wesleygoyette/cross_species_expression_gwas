# regland_api/models.py
# Models representing the database schema from the R Shiny app

from django.db import models


class Species(models.Model):
    species_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=200)
    genome_build = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        db_table = 'species'


class Gene(models.Model):
    gene_id = models.AutoField(primary_key=True)
    symbol = models.CharField(max_length=200)
    species_id = models.CharField(max_length=50)
    chrom = models.CharField(max_length=50)
    start = models.IntegerField()
    end = models.IntegerField()
    
    class Meta:
        db_table = 'genes'


class Enhancer(models.Model):
    enh_id = models.AutoField(primary_key=True)
    species_id = models.CharField(max_length=50)
    chrom = models.CharField(max_length=50)
    start = models.IntegerField()
    end = models.IntegerField()
    tissue = models.CharField(max_length=100, null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    source = models.CharField(max_length=200, null=True, blank=True)
    
    class Meta:
        db_table = 'enhancers_all'


class EnhancerClass(models.Model):
    enh_id = models.IntegerField(primary_key=True)
    class_name = models.CharField(max_length=50, db_column='class')
    
    class Meta:
        db_table = 'enhancer_class'


class GWASSnp(models.Model):
    snp_id = models.AutoField(primary_key=True)
    chrom = models.CharField(max_length=50)
    pos = models.IntegerField()
    rsid = models.CharField(max_length=50, unique=True, null=True, blank=True)
    trait = models.CharField(max_length=500, null=True, blank=True)
    pval = models.FloatField(null=True, blank=True)
    source = models.CharField(max_length=200, null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        db_table = 'gwas_snps'


class SnpToEnhancer(models.Model):
    snp_id = models.IntegerField()
    enh_id = models.IntegerField()
    overlap_bp = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'snp_to_enhancer'
        unique_together = ('snp_id', 'enh_id')


class GeneToEnhancer(models.Model):
    gene_id = models.IntegerField()
    enh_id = models.IntegerField()
    method = models.CharField(max_length=100, null=True, blank=True)
    distance_bp = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'gene_to_enhancer'
        unique_together = ('gene_id', 'enh_id')


class CTCFSite(models.Model):
    site_id = models.AutoField(primary_key=True)
    species_id = models.CharField(max_length=50)
    chrom = models.CharField(max_length=50)
    start = models.IntegerField()
    end = models.IntegerField()
    score = models.FloatField(null=True, blank=True)
    motif_p = models.FloatField(null=True, blank=True)
    cons_class = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        db_table = 'ctcf_sites'


class TADDomain(models.Model):
    tad_id = models.AutoField(primary_key=True)
    species_id = models.CharField(max_length=50)
    chrom = models.CharField(max_length=50)
    start = models.IntegerField()
    end = models.IntegerField()
    source = models.CharField(max_length=200, null=True, blank=True)
    
    class Meta:
        db_table = 'tad_domains'
