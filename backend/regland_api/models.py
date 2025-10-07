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
    symbol = models.CharField(max_length=200, db_index=True)
    species_id = models.CharField(max_length=50, db_index=True)
    chrom = models.CharField(max_length=50, db_index=True)
    start = models.IntegerField(db_index=True)
    end = models.IntegerField(db_index=True)
    
    class Meta:
        db_table = 'genes'


class Enhancer(models.Model):
    enh_id = models.AutoField(primary_key=True)
    species_id = models.CharField(max_length=50, db_index=True)
    chrom = models.CharField(max_length=50, db_index=True)
    start = models.IntegerField(db_index=True)
    end = models.IntegerField(db_index=True)
    tissue = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    score = models.FloatField(null=True, blank=True)
    source = models.CharField(max_length=200, null=True, blank=True)
    
    class Meta:
        db_table = 'enhancers_all'


class EnhancerClass(models.Model):
    enh_id = models.IntegerField(primary_key=True, db_index=True)
    class_name = models.CharField(max_length=50, db_column='class', db_index=True)
    
    class Meta:
        db_table = 'enhancer_class'


class GWASSnp(models.Model):
    snp_id = models.AutoField(primary_key=True)
    chrom = models.CharField(max_length=50, db_index=True)
    pos = models.IntegerField(db_index=True)
    rsid = models.CharField(max_length=50, unique=True, null=True, blank=True, db_index=True)
    trait = models.CharField(max_length=500, null=True, blank=True, db_index=True)
    pval = models.FloatField(null=True, blank=True)
    source = models.CharField(max_length=200, null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    
    class Meta:
        db_table = 'gwas_snps'


class SnpToEnhancer(models.Model):
    snp_id = models.IntegerField(db_index=True)
    enh_id = models.IntegerField(db_index=True)
    overlap_bp = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'snp_to_enhancer'
        unique_together = ('snp_id', 'enh_id')


class GeneToEnhancer(models.Model):
    gene_id = models.IntegerField(db_index=True)
    enh_id = models.IntegerField(db_index=True)
    method = models.CharField(max_length=100, null=True, blank=True)
    distance_bp = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'gene_to_enhancer'
        unique_together = ('gene_id', 'enh_id')


class CTCFSite(models.Model):
    site_id = models.AutoField(primary_key=True)
    species_id = models.CharField(max_length=50, db_index=True)
    chrom = models.CharField(max_length=50, db_index=True)
    start = models.IntegerField(db_index=True)
    end = models.IntegerField(db_index=True)
    score = models.FloatField(null=True, blank=True)
    motif_p = models.FloatField(null=True, blank=True)
    cons_class = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    
    class Meta:
        db_table = 'ctcf_sites'


class TADDomain(models.Model):
    tad_id = models.AutoField(primary_key=True)
    species_id = models.CharField(max_length=50, db_index=True)
    chrom = models.CharField(max_length=50, db_index=True)
    start = models.IntegerField(db_index=True)
    end = models.IntegerField(db_index=True)
    source = models.CharField(max_length=200, null=True, blank=True)
    
    class Meta:
        db_table = 'tad_domains'
