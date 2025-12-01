from rest_framework import serializers
from .models import Gene, Enhancer, EnhancerClass, GWASSnp, CTCFSite, TADDomain, SpeciesBiotypeCount, Species


class GeneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gene
        fields = ['gene_id', 'symbol', 'species_id', 'chrom', 'start', 'end']


class SpeciesSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='species_id', read_only=True)
    
    class Meta:
        model = Species
        fields = ['id', 'name', 'genome_build']


class EnhancerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enhancer
        fields = ['enh_id', 'species_id', 'chrom', 'start', 'end', 'tissue', 'score', 'source']


class EnhancerClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnhancerClass
        fields = ['enh_id', 'class_name']


class GWASSnpSerializer(serializers.ModelSerializer):
    class Meta:
        model = GWASSnp
        fields = ['snp_id', 'chrom', 'pos', 'rsid', 'trait', 'pval', 'source', 'category']


class CTCFSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CTCFSite
        fields = ['site_id', 'species_id', 'chrom', 'start', 'end', 'score', 'motif_p', 'cons_class']


class TADDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = TADDomain
        fields = ['tad_id', 'species_id', 'chrom', 'start', 'end', 'source']


class GeneRegionSerializer(serializers.Serializer):
    """Serializer for gene region data with enhancers and GWAS data"""
    gene = GeneSerializer()
    enhancers = EnhancerSerializer(many=True)
    gwas_snps = GWASSnpSerializer(many=True)
    ctcf_sites = CTCFSiteSerializer(many=True)
    region_start = serializers.IntegerField()
    region_end = serializers.IntegerField()
    tss = serializers.IntegerField()


class ConservationMatrixSerializer(serializers.Serializer):
    """Serializer for conservation matrix data"""
    bins = serializers.ListField(child=serializers.DictField())
    classes = serializers.ListField(child=serializers.CharField())
    region_start = serializers.IntegerField()
    region_end = serializers.IntegerField()
    
    
class ExpressionDataSerializer(serializers.Serializer):
    """Serializer for expression data"""
    symbol = serializers.CharField()
    tissue = serializers.CharField()
    tpm = serializers.FloatField()
    
    
class PlotDataSerializer(serializers.Serializer):
    """Serializer for plot data"""
    plot_type = serializers.CharField()
    data = serializers.JSONField()
    config = serializers.JSONField()


class SpeciesBiotypeCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeciesBiotypeCount
        fields = ['species_id', 'lncRNA_count', 'protein_coding_count', 'total']