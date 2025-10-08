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
    const [showAllTraits, setShowAllTraits] = useState(false);
    const [showAllSNPs, setShowAllSNPs] = useState(false);
    const [showAllGenes, setShowAllGenes] = useState(false);

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

    // Limit traits on mobile unless "show all" is clicked
    const displayedTraits = showAllTraits ? filteredTraits : filteredTraits.slice(0, 10);

    // Limit SNPs on mobile unless "show all" is clicked
    const displayedSNPs = showAllSNPs ? snpDetails : snpDetails.slice(0, 10);

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
        <section id="gwas" className="py-8 sm:py-16 px-4 bg-background">
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
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`text-xs sm:text-sm ${selectedCategory === cat.id ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-[#0a0e27]' : ''}`}
                            disabled={traitsLoading}
                        >
                            <span className="truncate max-w-[120px] sm:max-w-none">{cat.name}</span>
                            <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                                {cat.count}
                            </Badge>
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Traits List */}
                    <div className="lg:col-span-1 space-y-3">
                        <Card className="p-3 sm:p-4 bg-card border-border w-full overflow-hidden">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search traits..."
                                    className="pl-10 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {traitsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                                        {filteredTraits.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No traits found
                                            </p>
                                        ) : (
                                            displayedTraits.map((trait) => (
                                                <div
                                                    key={trait.trait}
                                                    className={`p-2 sm:p-3 rounded cursor-pointer transition-colors border ${selectedTrait === trait.trait
                                                        ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30'
                                                        : 'bg-muted/30 hover:bg-muted/50 border-transparent hover:border-[#00d4ff]/30'
                                                        }`}
                                                    onClick={() => setSelectedTrait(trait.trait)}
                                                >
                                                    <h4 className="text-xs sm:text-sm mb-2 break-words">{trait.trait}</h4>
                                                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                                                        <span>{trait.snp_count} SNPs</span>
                                                        <span>{trait.gene_count} genes</span>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs text-muted-foreground">min p-value:</span>
                                                        <code className="text-xs text-[#00ff88] font-mono break-all">
                                                            {trait.min_pval ? trait.min_pval.toExponential(2) : 'N/A'}
                                                        </code>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Show More/Less button for traits */}
                                    {filteredTraits.length > 10 && (
                                        <div className="pt-2 border-t border-border">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-[#00d4ff] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10"
                                                onClick={() => setShowAllTraits(!showAllTraits)}
                                            >
                                                {showAllTraits ? `Show Less (10 of ${filteredTraits.length})` : `Show All ${filteredTraits.length} Traits`}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2 w-full overflow-hidden">
                        <Card className="p-4 sm:p-6 bg-card border-border w-full overflow-hidden">
                            {!selectedTrait ? (
                                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                                    Select a trait to view details
                                </div>
                            ) : (
                                <Tabs defaultValue="snps" className="w-full">
                                    <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto">
                                        <TabsTrigger value="snps" className="text-xs sm:text-sm flex-1 sm:flex-initial">SNP Mapping</TabsTrigger>
                                        <TabsTrigger value="genes" className="text-xs sm:text-sm flex-1 sm:flex-initial">Associated Genes</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="snps" className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                                            <h3 className="text-base sm:text-lg break-words">SNP-to-Gene Mapping: {selectedTrait}</h3>
                                            {selectedTraitData && (
                                                <Badge variant="secondary" className="self-start sm:self-auto">
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
                                            <div className="space-y-3">
                                                <div className="space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2">
                                                    {displayedSNPs.map((snp) => (
                                                        <div
                                                            key={snp.snp_id}
                                                            className="p-3 sm:p-4 bg-muted/30 rounded border border-border hover:border-[#00d4ff]/30 transition-colors overflow-hidden"
                                                        >
                                                            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-muted-foreground mb-1">SNP ID</p>
                                                                    <code className="text-[#00d4ff] font-mono text-xs break-all">
                                                                        {snp.rsid || `chr${snp.chrom}:${snp.pos}`}
                                                                    </code>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                                                                    <code className="text-xs font-mono break-all">
                                                                        {snp.chrom}:{snp.pos?.toLocaleString()}
                                                                    </code>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-muted-foreground mb-1">P-value</p>
                                                                    <span className="text-[#ff8c42] text-xs break-all">
                                                                        {snp.pval ? snp.pval.toExponential(2) : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                                                                    <Badge variant="outline" className="text-xs truncate max-w-full">
                                                                        {snp.category || 'Uncategorized'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Show More/Less button for SNPs */}
                                                {snpDetails.length > 10 && (
                                                    <div className="pt-2 border-t border-border">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-[#00d4ff] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10"
                                                            onClick={() => setShowAllSNPs(!showAllSNPs)}
                                                        >
                                                            {showAllSNPs ? `Show Less (10 of ${snpDetails.length})` : `Show All ${snpDetails.length} SNPs`}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="genes" className="space-y-4">
                                        <h3 className="text-base sm:text-lg mb-4 break-words">Associated Genes: {selectedTrait}</h3>
                                        {snpsLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2">
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

                                                        const allGenes = Array.from(geneMap.entries())
                                                            .map(([gene, data]) => ({ gene, ...data }))
                                                            .sort((a, b) => b.snps - a.snps || a.minPval - b.minPval);

                                                        const genes = showAllGenes ? allGenes : allGenes.slice(0, 10);

                                                        if (genes.length === 0) {
                                                            return (
                                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                                    No gene associations available for this trait
                                                                </p>
                                                            );
                                                        }

                                                        return (
                                                            <>
                                                                {genes.map((item, idx) => {
                                                                    const score = Math.min(100, (item.snps / allGenes[0].snps) * 100);
                                                                    return (
                                                                        <div
                                                                            key={item.gene}
                                                                            className="p-3 bg-muted/30 rounded border border-border hover:border-[#00d4ff]/30 transition-colors overflow-hidden"
                                                                        >
                                                                            <div className="flex items-center justify-between mb-2 gap-2">
                                                                                <h4 className="text-sm text-[#00d4ff] break-all">{item.gene}</h4>
                                                                                <Badge variant="secondary" className="shrink-0 text-xs">
                                                                                    {item.snps} SNP{item.snps !== 1 ? 's' : ''}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-muted-foreground mb-2">
                                                                                <span>Rank: #{idx + 1}</span>
                                                                                <span className="break-all">
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
                                                                })}

                                                                {/* Show More/Less button for genes */}
                                                                {allGenes.length > 10 && (
                                                                    <div className="pt-2 border-t border-border">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="w-full text-[#00d4ff] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10"
                                                                            onClick={() => setShowAllGenes(!showAllGenes)}
                                                                        >
                                                                            {showAllGenes ? `Show Less (10 of ${allGenes.length})` : `Show All ${allGenes.length} Genes`}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
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
