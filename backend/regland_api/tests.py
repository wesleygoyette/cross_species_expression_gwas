from django.test import TestCase
from .models import Gene, Enhancer, GWASSnp, Species

class GeneModelTest(TestCase):
    def test_gene_creation(self):
        gene = Gene.objects.create(
            symbol='BDNF',
            species_id='human_hg38',
            chrom='chr11',
            start=27658300,
            end=27722000
        )
        self.assertEqual(gene.symbol, 'BDNF')
        self.assertEqual(gene.species_id, 'human_hg38')
        self.assertEqual(gene.chrom, 'chr11')
        self.assertTrue(gene.start < gene.end)

    def test_gene_str(self):
        gene = Gene.objects.create(
            symbol='TP53',
            species_id='human_hg38',
            chrom='chr17',
            start=7661779,
            end=7687550
        )
        self.assertEqual(str(gene.symbol), 'TP53')

class EnhancerModelTest(TestCase):
    def test_enhancer_creation(self):
        enhancer = Enhancer.objects.create(
            species_id='human_hg38',
            chrom='chr11',
            start=27660000,
            end=27670000,
            tissue='Brain',
            score=0.95,
            source='ENCODE'
        )
        self.assertEqual(enhancer.tissue, 'Brain')
        self.assertEqual(enhancer.source, 'ENCODE')
        self.assertTrue(enhancer.score > 0)

class GWASSnpModelTest(TestCase):
    def test_gwas_snp_creation(self):
        snp = GWASSnp.objects.create(
            chrom='chr11',
            pos=27665000,
            rsid='rs123456',
            trait='Height',
            pval=1e-8,
            source='GWAS Catalog',
            category='Anthropometric'
        )
        self.assertEqual(snp.rsid, 'rs123456')
        self.assertEqual(snp.trait, 'Height')
        self.assertTrue(snp.pval < 0.05)

class SpeciesModelTest(TestCase):
    def test_species_creation(self):
        species = Species.objects.create(
            species_id='mouse_mm39',
            name='Mouse',
            genome_build='mm39'
        )
        self.assertEqual(species.name, 'Mouse')
        self.assertEqual(species.genome_build, 'mm39')
