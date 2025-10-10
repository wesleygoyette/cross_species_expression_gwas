import { useState } from 'react';
import { Search, TrendingUp, Network, ChevronRight, Filter, ArrowRight, Sparkles, Database, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Trait {
    name: string;
    snps: number;
    genes: number;
    category: string;
    pValue: string;
    description?: string;
}

export function GWASPortal() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showBrowse, setShowBrowse] = useState(false);
    const [selectedTrait, setSelectedTrait] = useState<Trait | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'All Traits', count: 790, color: '#00d4ff', icon: Database },
        { id: 'metabolic', name: 'Metabolic', count: 156, color: '#00ff88', icon: Activity },
        { id: 'neurological', name: 'Neurological', count: 98, color: '#ff8c42', icon: TrendingUp },
        { id: 'immune', name: 'Immune', count: 124, color: '#a855f7', icon: Network },
        { id: 'cardiovascular', name: 'Cardiovascular', count: 87, color: '#ec4899', icon: Activity },
    ];

    const traits: Trait[] = [
        {
            name: 'Body Mass Index (BMI)',
            snps: 2847,
            genes: 412,
            category: 'metabolic',
            pValue: '5.2e-89',
            description: 'Association between genetic variants and body mass index across diverse populations'
        },
        {
            name: "Alzheimer's Disease",
            snps: 1243,
            genes: 156,
            category: 'neurological',
            pValue: '2.1e-76',
            description: 'Late-onset Alzheimer\'s disease genetic risk factors and pathways'
        },
        {
            name: 'Rheumatoid Arthritis',
            snps: 987,
            genes: 234,
            category: 'immune',
            pValue: '8.4e-65',
            description: 'Autoimmune arthritis genetic susceptibility loci and immune pathway genes'
        },
        {
            name: 'Type 2 Diabetes',
            snps: 3421,
            genes: 521,
            category: 'metabolic',
            pValue: '1.2e-92',
            description: 'Insulin resistance and glucose metabolism genetic associations'
        },
        {
            name: 'Coronary Artery Disease',
            snps: 1876,
            genes: 298,
            category: 'cardiovascular',
            pValue: '3.5e-71',
            description: 'Atherosclerotic cardiovascular disease risk variants and lipid pathways'
        },
        {
            name: 'Schizophrenia',
            snps: 2145,
            genes: 367,
            category: 'neurological',
            pValue: '6.8e-84',
            description: 'Neurodevelopmental and synaptic function genes in schizophrenia risk'
        },
        {
            name: "Crohn's Disease",
            snps: 1567,
            genes: 189,
            category: 'immune',
            pValue: '4.2e-58',
            description: 'Inflammatory bowel disease susceptibility and immune response genes'
        },
        {
            name: 'LDL Cholesterol',
            snps: 2234,
            genes: 334,
            category: 'metabolic',
            pValue: '1.9e-88',
            description: 'Low-density lipoprotein cholesterol level genetic determinants'
        },
        {
            name: "Parkinson's Disease",
            snps: 1456,
            genes: 203,
            category: 'neurological',
            pValue: '3.7e-68',
            description: 'Progressive neurological disorder genetic risk factors'
        },
        {
            name: 'Systemic Lupus',
            snps: 892,
            genes: 178,
            category: 'immune',
            pValue: '5.1e-54',
            description: 'Autoimmune disease affecting multiple organ systems'
        },
        {
            name: 'Hypertension',
            snps: 1678,
            genes: 267,
            category: 'cardiovascular',
            pValue: '2.8e-72',
            description: 'Blood pressure regulation and cardiovascular risk variants'
        },
        {
            name: 'Triglycerides',
            snps: 1987,
            genes: 289,
            category: 'metabolic',
            pValue: '4.3e-81',
            description: 'Serum triglyceride level genetic associations and lipid metabolism'
        },
    ];

    const popularSearches = [
        'Alzheimer\'s Disease',
        'Type 2 Diabetes',
        'BMI',
        'Coronary Artery Disease',
        'Schizophrenia',
        'Rheumatoid Arthritis'
    ];

    const filteredTraits = traits.filter(trait => {
        const matchesSearch = searchQuery === '' ||
            trait.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trait.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || trait.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleSearch = (query: string) => {
        if (query.trim() !== '') {
            setSearchQuery(query);
            setShowBrowse(true);
        }
    };

    const handleTraitSelect = (trait: Trait) => {
        setSelectedTrait(trait);
    };

    // Simple search interface (initial state)
    if (!showBrowse) {
        return (
            <section id="gwas" className="py-32 px-6 md:px-12 lg:px-16 bg-gradient-to-b from-background via-secondary/10 to-background min-h-screen flex items-center justify-center">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Hero Search */}
                    <div className="text-center mb-12">
                        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs px-4 py-1.5">
                            26,404 Disease Variants · 790 Human Traits
                        </Badge>

                        <h2 className="mb-6 text-3xl bg-gradient-to-r from-primary via-[var(--genomic-green)] to-primary bg-clip-text text-transparent">
                            GWAS Disease Portal
                        </h2>

                        <p className="text-lg text-foreground/90 mb-3">
                            Explore genetic associations across human diseases
                        </p>
                        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
                            Search for any disease, trait, gene, or SNP to discover genetic variants and their associations
                        </p>

                        {/* Main Search Bar */}
                        <div className="mb-8 group" style={{ position: 'relative' }}>
                            <Search
                                className="text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none"
                                style={{
                                    position: 'absolute',
                                    left: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '24px',
                                    height: '24px',
                                    zIndex: 10
                                }}
                            />
                            <Input
                                placeholder="Search diseases, traits, genes, or SNPs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(searchQuery);
                                    }
                                }}
                                className="bg-card border border-border hover:border-primary/30 focus:border-primary/50 transition-all shadow-lg shadow-black/20 text-lg w-full rounded-xl"
                                style={{
                                    paddingLeft: '56px',
                                    paddingRight: '24px',
                                    paddingTop: '20px',
                                    paddingBottom: '20px'
                                }}
                                autoFocus
                            />
                        </div>

                        {/* Popular Searches */}
                        <div className="mb-12">
                            <p className="text-sm text-muted-foreground mb-4">Popular searches:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {popularSearches.map((search) => (
                                    <button
                                        key={search}
                                        onClick={() => handleSearch(search)}
                                        className="px-4 py-2 bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/30 rounded-lg transition-all text-sm text-foreground/90 hover:text-foreground"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Or Browse */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div style={{ width: '300px', height: '1px', backgroundColor: 'rgba(156, 163, 175, 0.3)' }}></div>
                            <span className="text-sm text-muted-foreground">or</span>
                            <div style={{ width: '300px', height: '1px', backgroundColor: 'rgba(156, 163, 175, 0.3)' }}></div>
                        </div>

                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setShowBrowse(true)}
                            className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                        >
                            <Filter className="w-5 h-5 mr-2" />
                            Browse All Diseases by Category
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    // Browse/Results view
    return (
        <section id="gwas" className="py-16 px-6 md:px-12 lg:px-16 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Search Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowBrowse(false);
                                setSearchQuery('');
                                setSelectedTrait(null);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            ← Back to Search
                        </Button>
                    </div>

                    {/* Compact Search Bar */}
                    <div className="relative mb-6">
                        <Search
                            className="text-muted-foreground pointer-events-none"
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '20px',
                                height: '20px',
                                flexShrink: 0
                            }}
                        />
                        <Input
                            placeholder="Search diseases, traits, genes, or SNPs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(searchQuery);
                                }
                            }}
                            className="bg-card border-border hover:border-primary/30 focus:border-primary/50"
                            style={{
                                paddingLeft: '48px',
                                paddingRight: '16px',
                                paddingTop: '24px',
                                paddingBottom: '24px'
                            }}
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-3">
                        {categories.map((cat) => {
                            const IconComponent = cat.icon;
                            return (
                                <Button
                                    key={cat.id}
                                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={selectedCategory === cat.id ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border hover:border-primary/30'}
                                >
                                    <IconComponent className="w-4 h-4 mr-2" />
                                    {cat.name}
                                    <Badge
                                        variant="secondary"
                                        className={`ml-2 ${selectedCategory === cat.id ? 'bg-primary-foreground/20' : ''}`}
                                    >
                                        {cat.count}
                                    </Badge>
                                </Button>
                            );
                        })}
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-muted-foreground">
                        {filteredTraits.length} {filteredTraits.length === 1 ? 'result' : 'results'} found
                        {searchQuery && ` for "${searchQuery}"`}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Traits List */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2">
                            {filteredTraits.length === 0 ? (
                                <Card className="p-8 bg-card border-border text-center">
                                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 px-3">
                                        <Search className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h4 className="mb-2 text-foreground">No results found</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Try adjusting your search or category filter
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('all');
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                </Card>
                            ) : (
                                filteredTraits.map((trait) => (
                                    <Card
                                        key={trait.name}
                                        className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${selectedTrait?.name === trait.name
                                            ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/20'
                                            : 'bg-card border-border hover:border-primary/30'
                                            }`}
                                        onClick={() => handleTraitSelect(trait)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-sm flex-1">{trait.name}</h4>
                                            <ChevronRight className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${selectedTrait?.name === trait.name ? 'rotate-90' : ''
                                                }`} />
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                            <span>{trait.snps.toLocaleString()} SNPs</span>
                                            <span>{trait.genes.toLocaleString()} genes</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs" style={{
                                                backgroundColor: `${categories.find(c => c.id === trait.category)?.color}15`,
                                                borderColor: `${categories.find(c => c.id === trait.category)?.color}30`,
                                                color: categories.find(c => c.id === trait.category)?.color
                                            }}>
                                                {trait.category}
                                            </Badge>
                                            <code className="text-xs text-[var(--genomic-green)] font-mono">
                                                p={trait.pValue}
                                            </code>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2">
                        {selectedTrait ? (
                            <Card className="p-6 bg-card border-border">
                                {/* Trait Header */}
                                <div className="mb-6 pb-6 border-b border-border">
                                    <h3 className="mb-3">{selectedTrait.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {selectedTrait.description}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">SNPs</div>
                                            <div className="text-xl text-primary">{selectedTrait.snps.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Genes</div>
                                            <div className="text-xl text-[var(--genomic-green)]">{selectedTrait.genes.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">P-value</div>
                                            <code className="text-sm text-[var(--data-orange)] font-mono">{selectedTrait.pValue}</code>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Category</div>
                                            <Badge variant="outline" style={{
                                                backgroundColor: `${categories.find(c => c.id === selectedTrait.category)?.color}15`,
                                                borderColor: `${categories.find(c => c.id === selectedTrait.category)?.color}30`,
                                                color: categories.find(c => c.id === selectedTrait.category)?.color
                                            }}>
                                                {selectedTrait.category}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <Tabs defaultValue="snps" className="w-full">
                                    <TabsList className="mb-6 bg-secondary/50 border border-border">
                                        <TabsTrigger value="snps">SNP Mapping</TabsTrigger>
                                        <TabsTrigger value="genes">Associated Genes</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="snps" className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-foreground">Top SNP-to-Gene Associations</h4>
                                            <Badge variant="secondary">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                Genome-wide significant
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            {[
                                                { snp: 'rs429358', chr: 'chr19', pos: '45411941', gene: 'APOE', effect: 'Missense', odds: '3.68' },
                                                { snp: 'rs7412', chr: 'chr19', pos: '45412079', gene: 'APOE', effect: 'Missense', odds: '2.94' },
                                                { snp: 'rs6265', chr: 'chr11', pos: '27679916', gene: 'BDNF', effect: 'Missense', odds: '1.42' },
                                                { snp: 'rs1799971', chr: 'chr6', pos: '154039662', gene: 'OPRM1', effect: 'Synonymous', odds: '1.28' },
                                                { snp: 'rs1800497', chr: 'chr11', pos: '113270828', gene: 'DRD2', effect: '3\' UTR', odds: '1.35' },
                                            ].map((item) => (
                                                <div
                                                    key={item.snp}
                                                    className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">SNP ID</p>
                                                            <code className="text-primary font-mono">{item.snp}</code>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Location</p>
                                                            <code className="text-xs font-mono text-foreground/80">{item.chr}:{item.pos}</code>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Gene</p>
                                                            <span className="text-[var(--genomic-green)]">{item.gene}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Odds Ratio</p>
                                                            <span className="text-[var(--data-orange)]">{item.odds}</span>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">{item.effect}</Badge>
                                                </div>
                                            ))}
                                        </div>

                                        <Button variant="outline" className="w-full mt-4 border-primary/30 hover:bg-primary/10">
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                            View All {selectedTrait.snps.toLocaleString()} SNPs
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="genes" className="space-y-4">
                                        <h4 className="mb-4 text-foreground">Top Associated Genes</h4>
                                        <div className="space-y-2">
                                            {[
                                                { gene: 'FTO', score: 94, snps: 234, traits: 12, function: 'RNA demethylase, obesity risk' },
                                                { gene: 'MC4R', score: 89, snps: 187, traits: 8, function: 'Melanocortin receptor, energy balance' },
                                                { gene: 'TMEM18', score: 86, snps: 156, traits: 6, function: 'Transmembrane protein, body weight' },
                                                { gene: 'GNPDA2', score: 82, snps: 143, traits: 5, function: 'Glucosamine-6-phosphate, metabolism' },
                                                { gene: 'BDNF', score: 78, snps: 129, traits: 9, function: 'Brain-derived neurotrophic factor' },
                                                { gene: 'SEC16B', score: 75, snps: 118, traits: 4, function: 'ER to Golgi transport, obesity' },
                                            ].map((item) => (
                                                <div
                                                    key={item.gene}
                                                    className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-sm text-primary">{item.gene}</h4>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Score: {item.score}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{item.function}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                                                        <span>{item.snps} SNPs</span>
                                                        <span>·</span>
                                                        <span>{item.traits} associated traits</span>
                                                    </div>

                                                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary via-[var(--genomic-green)] to-[var(--data-orange)] rounded-full transition-all duration-500"
                                                            style={{ width: `${item.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Button variant="outline" className="w-full mt-4 border-primary/30 hover:bg-primary/10">
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                            View All {selectedTrait.genes.toLocaleString()} Associated Genes
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </Card>
                        ) : (
                            <Card
                                className="bg-card border-border text-center"
                                style={{
                                    padding: '48px'
                                }}
                            >
                                <div
                                    className="bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        minWidth: '80px',
                                        minHeight: '80px'
                                    }}
                                >
                                    <Search
                                        className="text-primary"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            flexShrink: 0
                                        }}
                                    />
                                </div>
                                <h3 className="mb-3 text-foreground">Select a trait to view details</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Choose any disease or trait from the list to explore genetic associations, SNP mappings,
                                    disease networks, and associated genes
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
