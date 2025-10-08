import { useState, useEffect } from 'react';
import { Search, TrendingUp, Network, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { getGWASCategories, getGWASTraits, getTraitSNPs, type GWASSnp } from '../utils/api';

interface Category {
    id: string;
    name: string;
    count: number;
}

interface Trait {
    trait: string;
    snp_count: number;
    gene_count: number;
    category: string;
    min_pval: number;
}

interface SNPDetail extends GWASSnp {
    associated_genes?: string;
}

export function GWASPortal() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [traits, setTraits] = useState<Trait[]>([]);
    const [snpDetails, setSNPDetails] = useState<SNPDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [traitsLoading, setTraitsLoading] = useState(false);
    const [snpsLoading, setSNPsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Load traits when category changes
    useEffect(() => {
        loadTraits();
    }, [selectedCategory]);

    // Load SNP details when a trait is selected
    useEffect(() => {
        if (selectedTrait) {
            loadSNPDetails(selectedTrait);
        }
    }, [selectedTrait]);

    async function loadCategories() {
        try {
            setLoading(true);
            setError(null);
            const data = await getGWASCategories();
            const allCategory: Category = {
                id: 'all',
                name: 'All Traits',
                count: data.categories.reduce((sum: number, cat: any) => sum + (cat.count || 0), 0)
            };
            // Map the backend categories to our format
            const mappedCategories: Category[] = data.categories.map((cat: any) => ({
                id: cat.id || cat.name,
                name: cat.name,
                count: cat.count
            }));
            setCategories([allCategory, ...mappedCategories]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load categories');
            console.error('Error loading categories:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadTraits() {
        try {
            setTraitsLoading(true);
            setError(null);
            const data = await getGWASTraits(selectedCategory === 'all' ? undefined : selectedCategory);
            setTraits(data.traits);
            // Auto-select first trait if none selected
            if (data.traits.length > 0 && !selectedTrait) {
                setSelectedTrait(data.traits[0].trait);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load traits');
            console.error('Error loading traits:', err);
        } finally {
            setTraitsLoading(false);
        }
    }

    async function loadSNPDetails(trait: string) {
        try {
            setSNPsLoading(true);
            setError(null);
            const data = await getTraitSNPs(trait, 100);
            setSNPDetails(data.snps);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load SNP details');
            console.error('Error loading SNP details:', err);
        } finally {
            setSNPsLoading(false);
        }
    }

    const filteredTraits = traits.filter(t =>
        searchQuery === '' || t.trait.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedTraitData = traits.find(t => t.trait === selectedTrait);

    if (loading) {
        return (
            <section id="gwas" className="py-16 px-4 bg-background">
                <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
                        <span className="text-muted-foreground">Loading GWAS data...</span>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="gwas" className="py-16 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl mb-3">GWAS Disease Portal</h2>
                    <p className="text-muted-foreground">
                        Explore {traits.length} disease-associated traits with {categories[0]?.count || 0} variants
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Category filters */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={selectedCategory === cat.id ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-[#0a0e27]' : ''}
                            disabled={traitsLoading}
                        >
                            {cat.name}
                            <Badge variant="secondary" className="ml-2">
                                {cat.count}
                            </Badge>
                        </Button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Traits List */}
                    <div className="lg:col-span-1 space-y-3">
                        <Card className="p-4 bg-card border-border">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search traits..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {traitsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {filteredTraits.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No traits found
                                        </p>
                                    ) : (
                                        filteredTraits.map((trait) => (
                                            <div
                                                key={trait.trait}
                                                className={`p-3 rounded cursor-pointer transition-colors border ${selectedTrait === trait.trait
                                                    ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30'
                                                    : 'bg-muted/30 hover:bg-muted/50 border-transparent hover:border-[#00d4ff]/30'
                                                    }`}
                                                onClick={() => setSelectedTrait(trait.trait)}
                                            >
                                                <h4 className="text-sm mb-2">{trait.trait}</h4>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>{trait.snp_count} SNPs</span>
                                                    <span>{trait.gene_count} genes</span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">min p-value:</span>
                                                    <code className="text-xs text-[#00ff88] font-mono">
                                                        {trait.min_pval ? trait.min_pval.toExponential(2) : 'N/A'}
                                                    </code>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2">
                        <Card className="p-6 bg-card border-border">
                            {!selectedTrait ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground">
                                    Select a trait to view details
                                </div>
                            ) : (
                                <Tabs defaultValue="snps" className="w-full">
                                    <TabsList className="mb-6">
                                        <TabsTrigger value="snps">SNP Mapping</TabsTrigger>
                                        <TabsTrigger value="genes">Associated Genes</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="snps" className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg">SNP-to-Gene Mapping: {selectedTrait}</h3>
                                            {selectedTraitData && (
                                                <Badge variant="secondary">
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                    {selectedTraitData.snp_count} total SNPs
                                                </Badge>
                                            )}
                                        </div>

                                        {snpsLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
                                            </div>
                                        ) : snpDetails.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No SNP data available for this trait
                                            </p>
                                        ) : (
                                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                                {snpDetails.map((snp) => (
                                                    <div
                                                        key={snp.snp_id}
                                                        className="p-4 bg-muted/30 rounded border border-border hover:border-[#00d4ff]/30 transition-colors"
                                                    >
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">SNP ID</p>
                                                                <code className="text-[#00d4ff] font-mono">
                                                                    {snp.rsid || `chr${snp.chrom}:${snp.pos}`}
                                                                </code>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">Location</p>
                                                                <code className="text-xs font-mono">
                                                                    {snp.chrom}:{snp.pos?.toLocaleString()}
                                                                </code>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">P-value</p>
                                                                <span className="text-[#ff8c42] text-xs">
                                                                    {snp.pval ? snp.pval.toExponential(2) : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">Category</p>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {snp.category || 'Uncategorized'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="genes" className="space-y-4">
                                        <h3 className="text-lg mb-4">Associated Genes: {selectedTrait}</h3>
                                        {snpsLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                                {(() => {
                                                    // Aggregate genes from SNPs
                                                    const geneMap = new Map<string, { snps: number; minPval: number }>();
                                                    snpDetails.forEach(snp => {
                                                        if (snp.associated_genes) {
                                                            const genes = snp.associated_genes.split(',');
                                                            genes.forEach(gene => {
                                                                const g = gene.trim();
                                                                if (g) {
                                                                    const existing = geneMap.get(g);
                                                                    if (existing) {
                                                                        existing.snps += 1;
                                                                        existing.minPval = Math.min(existing.minPval, snp.pval || Infinity);
                                                                    } else {
                                                                        geneMap.set(g, { snps: 1, minPval: snp.pval || Infinity });
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });

                                                    const genes = Array.from(geneMap.entries())
                                                        .map(([gene, data]) => ({ gene, ...data }))
                                                        .sort((a, b) => b.snps - a.snps || a.minPval - b.minPval)
                                                        .slice(0, 20);

                                                    if (genes.length === 0) {
                                                        return (
                                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                                No gene associations available for this trait
                                                            </p>
                                                        );
                                                    }

                                                    return genes.map((item, idx) => {
                                                        const score = Math.min(100, (item.snps / genes[0].snps) * 100);
                                                        return (
                                                            <div
                                                                key={item.gene}
                                                                className="p-3 bg-muted/30 rounded border border-border hover:border-[#00d4ff]/30 transition-colors"
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-sm text-[#00d4ff]">{item.gene}</h4>
                                                                    <Badge variant="secondary">
                                                                        {item.snps} SNP{item.snps !== 1 ? 's' : ''}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                                                                    <span>Rank: #{idx + 1}</span>
                                                                    <span>
                                                                        Min p-value: {item.minPval !== Infinity ? item.minPval.toExponential(2) : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 h-1.5 bg-muted rounded overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88]"
                                                                        style={{ width: `${score}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
