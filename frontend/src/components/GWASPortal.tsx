import { useState, useEffect } from 'react';
import { Search, TrendingUp, Network, ChevronRight, Filter, ArrowRight, Sparkles, Database, Activity, Loader2, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from './ui/pagination';
import { getGWASCategories, getGWASTraits, getTraitSNPs, type GWASSnp } from '../utils/api';

interface Trait {
    trait: string;
    snp_count: number;
    gene_count: number;
    category: string;
    min_pval: number;
}

interface Category {
    id: string;
    name: string;
    count: number;
    color: string;
    icon: any;
}

interface TraitSNP extends GWASSnp {
    associated_genes?: string;
}


export function GWASPortal() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearchQuery, setActiveSearchQuery] = useState(''); // The query actually being searched
    const [showBrowse, setShowBrowse] = useState(false);
    const [selectedTrait, setSelectedTrait] = useState<Trait | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState<Category[]>([]);
    const [traits, setTraits] = useState<Trait[]>([]);
    const [traitSnps, setTraitSnps] = useState<TraitSNP[]>([]);
    const [loading, setLoading] = useState(false);
    const [snpsLoading, setSnpsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [snpCurrentPage, setSnpCurrentPage] = useState(1);
    const [snpItemsPerPage] = useState(5);
    const [geneCurrentPage, setGeneCurrentPage] = useState(1);
    const [geneItemsPerPage] = useState(5);

    // Default category icons and colors
    const getCategoryIcon = (category: string) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower.includes('metabolic')) return Activity;
        if (categoryLower.includes('neuro') || categoryLower.includes('brain')) return TrendingUp;
        if (categoryLower.includes('immune') || categoryLower.includes('auto')) return Network;
        if (categoryLower.includes('cardio') || categoryLower.includes('heart')) return Activity;
        return Database;
    };

    const getCategoryColor = (index: number) => {
        const colors = ['#00d4ff', '#00ff88', '#ff8c42', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
        return colors[index % colors.length];
    };

    // Load categories and traits on mount
    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (showBrowse) {
            loadTraits();
        }
    }, [showBrowse, activeSearchQuery]);

    // Load selected trait's SNPs
    useEffect(() => {
        if (selectedTrait) {
            loadTraitSNPs(selectedTrait.trait);
            setSnpCurrentPage(1); // Reset SNP pagination when trait changes
            setGeneCurrentPage(1); // Reset gene pagination when trait changes
        }
    }, [selectedTrait]);

    // Reset pagination when category changes or active search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, activeSearchQuery]);

    const loadCategories = async () => {
        try {
            // Initialize with just "All Traits" - other categories will be populated when traits load
            const categoryList: Category[] = [
                {
                    id: 'all',
                    name: 'All Traits',
                    count: 0, // Will be updated when traits load
                    color: '#00d4ff',
                    icon: Database
                }
            ];

            setCategories(categoryList);
        } catch (err) {
            console.error('Error loading categories:', err);
            setError('Failed to load categories');
        }
    };

    const loadTraits = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load traits with search query if provided
            // The backend will handle filtering by search query (traits, genes, SNPs, categories)
            const response = await getGWASTraits(undefined, activeSearchQuery);

            if (response.traits && Array.isArray(response.traits)) {
                // Normalize traits: set empty/null categories to "Unlabeled"
                const normalizedTraits = response.traits.map(trait => ({
                    ...trait,
                    category: (trait.category && trait.category.trim() !== '') ? trait.category : 'Unlabeled'
                }));

                setTraits(normalizedTraits);

                // Rebuild categories based on actual data
                const categoryCounts = new Map<string, number>();
                normalizedTraits.forEach(trait => {
                    const cat = trait.category || 'Unlabeled';
                    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
                });

                const categoryList: Category[] = [
                    {
                        id: 'all',
                        name: 'All Traits',
                        count: normalizedTraits.length,
                        color: '#00d4ff',
                        icon: Database
                    }
                ];

                // Add categories that actually exist in the data
                Array.from(categoryCounts.entries())
                    .sort((a, b) => b[1] - a[1]) // Sort by count descending
                    .forEach(([categoryName, count], index) => {
                        categoryList.push({
                            id: categoryName,
                            name: categoryName,
                            count: count,
                            color: categoryName === 'Unlabeled' ? '#64748b' : getCategoryColor(index + 1),
                            icon: getCategoryIcon(categoryName)
                        });
                    });

                setCategories(categoryList);
            }
        } catch (err) {
            console.error('Error loading traits:', err);
            setError('Failed to load traits');
        } finally {
            setLoading(false);
        }
    };

    const loadTraitSNPs = async (traitName: string) => {
        setSnpsLoading(true);
        setTraitSnps([]); // Clear SNPs when starting to load new ones
        try {
            const response = await getTraitSNPs(traitName); // Removed limit to get all SNPs
            if (response.snps && Array.isArray(response.snps)) {
                setTraitSnps(response.snps);
            }
        } catch (err) {
            console.error('Error loading trait SNPs:', err);
        } finally {
            setSnpsLoading(false);
        }
    };

    const popularSearches = [
        'BMI',
        'Type 2 Diabetes',
        'Coronary Artery Disease',
        'COVID-19',
        'Schizophrenia',
        'Rheumatoid Arthritis'
    ];

    const filteredTraits = traits.filter(trait => {
        // Only apply category filter - search is handled by backend
        const matchesCategory = selectedCategory === 'all' || trait.category === selectedCategory;
        return matchesCategory;
    });

    // Since search is now handled by backend, searchFilteredTraits is same as traits
    const searchFilteredTraits = traits;

    const handleSearch = (query: string) => {
        if (query.trim() !== '') {
            setSearchQuery(query);
            setActiveSearchQuery(query); // Set the active search query to trigger backend search
            setSelectedCategory('all'); // Reset category filter to "all" when searching
            setCurrentPage(1); // Reset to first page on search
            setShowBrowse(true);

            // Scroll to the GWAS section after state updates
            setTimeout(() => {
                const gwasSection = document.getElementById('gwas');
                if (gwasSection) {
                    gwasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    const handleTraitSelect = (trait: Trait) => {
        setSelectedTrait(trait);
    };

    const formatPValue = (pval: number | null | undefined): string => {
        if (!pval) return 'N/A';
        if (pval < 0.0001) {
            return pval.toExponential(1);
        }
        return pval.toFixed(4);
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
                                setActiveSearchQuery('');
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
                            // Calculate count based on current search (not including category filter)
                            const categoryCount = cat.id === 'all'
                                ? searchFilteredTraits.length
                                : searchFilteredTraits.filter(t => t.category === cat.id).length;

                            return (
                                <Button
                                    key={cat.id}
                                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={selectedCategory === cat.id ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border hover:border-primary/30'}
                                >
                                    {/* <IconComponent className="w-4 h-4 mr-2" /> */}
                                    {cat.name}
                                    <Badge
                                        variant="secondary"
                                        className={`ml-2 ${selectedCategory === cat.id ? 'bg-primary-foreground/20' : ''}`}
                                    >
                                        {categoryCount}
                                    </Badge>
                                </Button>
                            );
                        })}
                    </div>

                    {/* Results Count */}
                    {activeSearchQuery && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading traits...
                                </div>
                            ) : (
                                <>
                                    {selectedCategory !== 'all' ? (
                                        // Show specific message when search + category filter are active
                                        <>
                                            {filteredTraits.length} {filteredTraits.length === 1 ? 'result' : 'results'} for "{activeSearchQuery}"
                                            {' '}in {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                                            {' '}({searchFilteredTraits.length} total)
                                        </>
                                    ) : (
                                        // Show simple message when only search is active
                                        <>
                                            {filteredTraits.length} {filteredTraits.length === 1 ? 'result' : 'results'} found for "{activeSearchQuery}"
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Traits List */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : filteredTraits.length === 0 ? (
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
                                            setActiveSearchQuery('');
                                            setSelectedCategory('all');
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                </Card>
                            ) : (
                                <>
                                    {/* Calculate pagination */}
                                    {(() => {
                                        const totalPages = Math.ceil(filteredTraits.length / itemsPerPage);
                                        const startIndex = (currentPage - 1) * itemsPerPage;
                                        const endIndex = startIndex + itemsPerPage;
                                        const paginatedTraits = filteredTraits.slice(startIndex, endIndex);

                                        return (
                                            <>
                                                {/* Traits List */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {paginatedTraits.map((trait) => (
                                                        <Card
                                                            key={trait.trait}
                                                            className={`cursor-pointer transition-all hover:scale-[1.01] ${selectedTrait?.trait === trait.trait
                                                                ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/20'
                                                                : 'bg-card border-border hover:border-primary/30'
                                                                }`}
                                                            onClick={() => handleTraitSelect(trait)}
                                                            style={{ padding: '16px 12px' }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                                <h4 style={{ fontSize: '13px', fontWeight: 500, lineHeight: '1.2', margin: 0, flex: 1 }}>{trait.trait}</h4>
                                                                <ChevronRight
                                                                    className={`transition-transform ${selectedTrait?.trait === trait.trait ? 'rotate-90' : ''}`}
                                                                    style={{ width: '13px', height: '13px', flexShrink: 0, marginLeft: '6px', marginTop: '0px' }}
                                                                />
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', marginBottom: '0px' }} className="text-muted-foreground">
                                                                <span>{trait.snp_count.toLocaleString()} SNPs</span>
                                                                <span>{trait.gene_count.toLocaleString()} genes</span>
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Badge
                                                                    variant="outline"
                                                                    style={{
                                                                        backgroundColor: `${categories.find(c => c.id === trait.category)?.color}15`,
                                                                        borderColor: `${categories.find(c => c.id === trait.category)?.color}30`,
                                                                        color: categories.find(c => c.id === trait.category)?.color,
                                                                        fontSize: '10px',
                                                                        padding: '0px 5px',
                                                                        height: '16px',
                                                                        lineHeight: '16px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    {trait.category}
                                                                </Badge>
                                                                <code style={{ fontSize: '10px', fontFamily: 'monospace' }} className="text-[var(--genomic-green)]">
                                                                    p={formatPValue(trait.min_pval)}
                                                                </code>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>

                                                {/* Pagination */}
                                                {totalPages > 1 && (
                                                    <Pagination className="mt-4">
                                                        <PaginationContent className="gap-1">
                                                            <PaginationItem>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (currentPage > 1) {
                                                                            setCurrentPage(currentPage - 1);
                                                                        }
                                                                    }}
                                                                    disabled={currentPage === 1}
                                                                    className="h-8 gap-1 px-2"
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                    <span className="hidden sm:inline">Previous</span>
                                                                </Button>
                                                            </PaginationItem>

                                                            {/* Page Numbers */}
                                                            {(() => {
                                                                const pages = [];
                                                                const maxVisiblePages = 5;

                                                                if (totalPages <= maxVisiblePages) {
                                                                    // Show all pages if total is small
                                                                    for (let i = 1; i <= totalPages; i++) {
                                                                        pages.push(
                                                                            <PaginationItem key={i}>
                                                                                <Button
                                                                                    variant={currentPage === i ? "default" : "outline"}
                                                                                    size="sm"
                                                                                    onClick={() => setCurrentPage(i)}
                                                                                    className="h-8 w-8 p-0"
                                                                                >
                                                                                    {i}
                                                                                </Button>
                                                                            </PaginationItem>
                                                                        );
                                                                    }
                                                                } else {
                                                                    // Show first page
                                                                    pages.push(
                                                                        <PaginationItem key={1}>
                                                                            <Button
                                                                                variant={currentPage === 1 ? "default" : "outline"}
                                                                                size="sm"
                                                                                onClick={() => setCurrentPage(1)}
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                1
                                                                            </Button>
                                                                        </PaginationItem>
                                                                    );

                                                                    // Show ellipsis if needed
                                                                    if (currentPage > 3) {
                                                                        pages.push(
                                                                            <PaginationItem key="ellipsis1">
                                                                                <span className="flex h-8 w-8 items-center justify-center">
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </span>
                                                                            </PaginationItem>
                                                                        );
                                                                    }

                                                                    // Show current page and neighbors
                                                                    const start = Math.max(2, currentPage - 1);
                                                                    const end = Math.min(totalPages - 1, currentPage + 1);

                                                                    for (let i = start; i <= end; i++) {
                                                                        pages.push(
                                                                            <PaginationItem key={i}>
                                                                                <Button
                                                                                    variant={currentPage === i ? "default" : "outline"}
                                                                                    size="sm"
                                                                                    onClick={() => setCurrentPage(i)}
                                                                                    className="h-8 w-8 p-0"
                                                                                >
                                                                                    {i}
                                                                                </Button>
                                                                            </PaginationItem>
                                                                        );
                                                                    }

                                                                    // Show ellipsis if needed
                                                                    if (currentPage < totalPages - 2) {
                                                                        pages.push(
                                                                            <PaginationItem key="ellipsis2">
                                                                                <span className="flex h-8 w-8 items-center justify-center">
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </span>
                                                                            </PaginationItem>
                                                                        );
                                                                    }

                                                                    // Show last page
                                                                    pages.push(
                                                                        <PaginationItem key={totalPages}>
                                                                            <Button
                                                                                variant={currentPage === totalPages ? "default" : "outline"}
                                                                                size="sm"
                                                                                onClick={() => setCurrentPage(totalPages)}
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                {totalPages}
                                                                            </Button>
                                                                        </PaginationItem>
                                                                    );
                                                                }

                                                                return pages;
                                                            })()}

                                                            <PaginationItem>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (currentPage < totalPages) {
                                                                            setCurrentPage(currentPage + 1);
                                                                        }
                                                                    }}
                                                                    disabled={currentPage === totalPages}
                                                                    className="h-8 gap-1 px-2"
                                                                >
                                                                    <span className="hidden sm:inline">Next</span>
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </Button>
                                                            </PaginationItem>
                                                        </PaginationContent>
                                                    </Pagination>
                                                )}
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2">
                        {selectedTrait ? (
                            <Card className="p-6 bg-card border-border">
                                {/* Trait Header */}
                                <div className={`mb-6 ${traitSnps.some(snp => snp.associated_genes && snp.associated_genes.trim()) ? 'pb-6 border-b border-border' : ''}`}>
                                    <h3 className="mb-3">{selectedTrait.trait}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Genetic associations for {selectedTrait.trait.toLowerCase()} across the genome
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">SNPs</div>
                                            <div className="text-xl text-primary">{selectedTrait.snp_count.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Genes</div>
                                            <div className="text-xl text-[var(--genomic-green)]">{selectedTrait.gene_count.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Min P-value</div>
                                            <code className="text-sm text-[var(--data-orange)] font-mono">{formatPValue(selectedTrait.min_pval)}</code>
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
                                {(() => {
                                    // Check if there are any associated genes
                                    const hasAssociatedGenes = traitSnps.some(snp => snp.associated_genes && snp.associated_genes.trim());

                                    // If no associated genes, don't render tabs at all
                                    if (!hasAssociatedGenes) {
                                        return null;
                                    }

                                    return (
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

                                                {snpsLoading ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                    </div>
                                                ) : traitSnps.length > 0 ? (
                                                    <>
                                                        {/* Calculate pagination */}
                                                        {(() => {
                                                            const totalPages = Math.ceil(traitSnps.length / snpItemsPerPage);
                                                            const startIndex = (snpCurrentPage - 1) * snpItemsPerPage;
                                                            const endIndex = startIndex + snpItemsPerPage;
                                                            const paginatedSnps = traitSnps.slice(startIndex, endIndex);

                                                            return (
                                                                <>
                                                                    <div className="space-y-3">
                                                                        {paginatedSnps.map((snp) => (
                                                                            <div
                                                                                key={snp.snp_id}
                                                                                className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                                                                            >
                                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                                                                    <div>
                                                                                        <p className="text-xs text-muted-foreground mb-1">SNP ID</p>
                                                                                        <code className="text-primary font-mono">{snp.rsid || `SNP_${snp.snp_id}`}</code>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                                                                                        <code className="text-xs font-mono text-foreground/80">{snp.chrom}:{snp.pos.toLocaleString()}</code>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs text-muted-foreground mb-1">Genes</p>
                                                                                        <span className="text-[var(--genomic-green)] text-xs">
                                                                                            {(() => {
                                                                                                if (!snp.associated_genes) return 'N/A';
                                                                                                const genes = snp.associated_genes.split(',');
                                                                                                if (genes.length <= 3) {
                                                                                                    return snp.associated_genes;
                                                                                                }
                                                                                                return `${genes.slice(0, 3).join(', ')} + ${genes.length - 3} more`;
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs text-muted-foreground mb-1">P-value</p>
                                                                                        <code className="text-[var(--data-orange)] text-xs font-mono">{formatPValue(snp.pval)}</code>
                                                                                    </div>
                                                                                </div>
                                                                                {snp.source && (
                                                                                    <Badge variant="outline" className="text-xs">{snp.source}</Badge>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Pagination */}
                                                                    {totalPages > 1 && (
                                                                        <Pagination className="mt-4">
                                                                            <PaginationContent className="gap-1">
                                                                                <PaginationItem>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            if (snpCurrentPage > 1) {
                                                                                                setSnpCurrentPage(snpCurrentPage - 1);
                                                                                            }
                                                                                        }}
                                                                                        disabled={snpCurrentPage === 1}
                                                                                        className="h-8 gap-1 px-2"
                                                                                    >
                                                                                        <ChevronLeft className="h-4 w-4" />
                                                                                        <span className="hidden sm:inline">Previous</span>
                                                                                    </Button>
                                                                                </PaginationItem>

                                                                                {/* Page Numbers */}
                                                                                {(() => {
                                                                                    const pages = [];
                                                                                    const maxVisiblePages = 5;

                                                                                    if (totalPages <= maxVisiblePages) {
                                                                                        // Show all pages if total is small
                                                                                        for (let i = 1; i <= totalPages; i++) {
                                                                                            pages.push(
                                                                                                <PaginationItem key={i}>
                                                                                                    <Button
                                                                                                        variant={snpCurrentPage === i ? "default" : "outline"}
                                                                                                        size="sm"
                                                                                                        onClick={() => setSnpCurrentPage(i)}
                                                                                                        className="h-8 w-8 p-0"
                                                                                                    >
                                                                                                        {i}
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }
                                                                                    } else {
                                                                                        // Show first page
                                                                                        pages.push(
                                                                                            <PaginationItem key={1}>
                                                                                                <Button
                                                                                                    variant={snpCurrentPage === 1 ? "default" : "outline"}
                                                                                                    size="sm"
                                                                                                    onClick={() => setSnpCurrentPage(1)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                                >
                                                                                                    1
                                                                                                </Button>
                                                                                            </PaginationItem>
                                                                                        );

                                                                                        // Show ellipsis if needed
                                                                                        if (snpCurrentPage > 3) {
                                                                                            pages.push(
                                                                                                <PaginationItem key="ellipsis-start">
                                                                                                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }

                                                                                        // Show current page and neighbors
                                                                                        const start = Math.max(2, snpCurrentPage - 1);
                                                                                        const end = Math.min(totalPages - 1, snpCurrentPage + 1);

                                                                                        for (let i = start; i <= end; i++) {
                                                                                            pages.push(
                                                                                                <PaginationItem key={i}>
                                                                                                    <Button
                                                                                                        variant={snpCurrentPage === i ? "default" : "outline"}
                                                                                                        size="sm"
                                                                                                        onClick={() => setSnpCurrentPage(i)}
                                                                                                        className="h-8 w-8 p-0"
                                                                                                    >
                                                                                                        {i}
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }

                                                                                        // Show ellipsis if needed
                                                                                        if (snpCurrentPage < totalPages - 2) {
                                                                                            pages.push(
                                                                                                <PaginationItem key="ellipsis-end">
                                                                                                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }

                                                                                        // Show last page
                                                                                        pages.push(
                                                                                            <PaginationItem key={totalPages}>
                                                                                                <Button
                                                                                                    variant={snpCurrentPage === totalPages ? "default" : "outline"}
                                                                                                    size="sm"
                                                                                                    onClick={() => setSnpCurrentPage(totalPages)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                                >
                                                                                                    {totalPages}
                                                                                                </Button>
                                                                                            </PaginationItem>
                                                                                        );
                                                                                    }

                                                                                    return pages;
                                                                                })()}

                                                                                <PaginationItem>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            if (snpCurrentPage < totalPages) {
                                                                                                setSnpCurrentPage(snpCurrentPage + 1);
                                                                                            }
                                                                                        }}
                                                                                        disabled={snpCurrentPage === totalPages}
                                                                                        className="h-8 gap-1 px-2"
                                                                                    >
                                                                                        <span className="hidden sm:inline">Next</span>
                                                                                        <ChevronRight className="h-4 w-4" />
                                                                                    </Button>
                                                                                </PaginationItem>
                                                                            </PaginationContent>
                                                                        </Pagination>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        No SNP data available for this trait
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="genes" className="space-y-4">
                                                <h4 className="mb-4 text-foreground">Associated Genes</h4>
                                                {snpsLoading ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                    </div>
                                                ) : traitSnps.length > 0 ? (
                                                    <>
                                                        {/* Calculate pagination */}
                                                        {(() => {
                                                            // Get unique genes
                                                            const uniqueGenes = Array.from(new Set(
                                                                traitSnps
                                                                    .filter(snp => snp.associated_genes)
                                                                    .flatMap(snp => snp.associated_genes?.split(',') || [])
                                                                    .filter(g => g && g.trim())
                                                            ));

                                                            const totalPages = Math.ceil(uniqueGenes.length / geneItemsPerPage);
                                                            const startIndex = (geneCurrentPage - 1) * geneItemsPerPage;
                                                            const endIndex = startIndex + geneItemsPerPage;
                                                            const paginatedGenes = uniqueGenes.slice(startIndex, endIndex);

                                                            return (
                                                                <>
                                                                    <div className="space-y-2">
                                                                        {paginatedGenes.map((gene, index) => {
                                                                            const geneSnps = traitSnps.filter(snp =>
                                                                                snp.associated_genes?.includes(gene)
                                                                            );
                                                                            const minPval = Math.min(...geneSnps.map(s => s.pval || 1));

                                                                            return (
                                                                                <div
                                                                                    key={gene}
                                                                                    className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                                                                                >
                                                                                    <div className="flex items-start justify-between mb-3">
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-center gap-3 mb-1">
                                                                                                <h4 className="text-sm text-primary">{gene}</h4>
                                                                                                <Badge variant="secondary" className="text-xs">
                                                                                                    {geneSnps.length} SNP{geneSnps.length !== 1 ? 's' : ''}
                                                                                                </Badge>
                                                                                            </div>
                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                Min p-value: {formatPValue(minPval)}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {/* Pagination */}
                                                                    {totalPages > 1 && (
                                                                        <Pagination className="mt-4">
                                                                            <PaginationContent className="gap-1">
                                                                                <PaginationItem>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            if (geneCurrentPage > 1) {
                                                                                                setGeneCurrentPage(geneCurrentPage - 1);
                                                                                            }
                                                                                        }}
                                                                                        disabled={geneCurrentPage === 1}
                                                                                        className="h-8 gap-1 px-2"
                                                                                    >
                                                                                        <ChevronLeft className="h-4 w-4" />
                                                                                        <span className="hidden sm:inline">Previous</span>
                                                                                    </Button>
                                                                                </PaginationItem>

                                                                                {/* Page Numbers */}
                                                                                {(() => {
                                                                                    const pages = [];
                                                                                    const maxVisiblePages = 5;

                                                                                    if (totalPages <= maxVisiblePages) {
                                                                                        // Show all pages if total is small
                                                                                        for (let i = 1; i <= totalPages; i++) {
                                                                                            pages.push(
                                                                                                <PaginationItem key={i}>
                                                                                                    <Button
                                                                                                        variant={geneCurrentPage === i ? "default" : "outline"}
                                                                                                        size="sm"
                                                                                                        onClick={() => setGeneCurrentPage(i)}
                                                                                                        className="h-8 w-8 p-0"
                                                                                                    >
                                                                                                        {i}
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }
                                                                                    } else {
                                                                                        // Show first page
                                                                                        pages.push(
                                                                                            <PaginationItem key={1}>
                                                                                                <Button
                                                                                                    variant={geneCurrentPage === 1 ? "default" : "outline"}
                                                                                                    size="sm"
                                                                                                    onClick={() => setGeneCurrentPage(1)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                                >
                                                                                                    1
                                                                                                </Button>
                                                                                            </PaginationItem>
                                                                                        );

                                                                                        // Show ellipsis if needed
                                                                                        if (geneCurrentPage > 3) {
                                                                                            pages.push(
                                                                                                <PaginationItem key="ellipsis-start">
                                                                                                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }

                                                                                        // Show current page and neighbors
                                                                                        const start = Math.max(2, geneCurrentPage - 1);
                                                                                        const end = Math.min(totalPages - 1, geneCurrentPage + 1);

                                                                                        for (let i = start; i <= end; i++) {
                                                                                            pages.push(
                                                                                                <PaginationItem key={i}>
                                                                                                    <Button
                                                                                                        variant={geneCurrentPage === i ? "default" : "outline"}
                                                                                                        size="sm"
                                                                                                        onClick={() => setGeneCurrentPage(i)}
                                                                                                        className="h-8 w-8 p-0"
                                                                                                    >
                                                                                                        {i}
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }

                                                                                        // Show ellipsis if needed
                                                                                        if (geneCurrentPage < totalPages - 2) {
                                                                                            pages.push(
                                                                                                <PaginationItem key="ellipsis-end">
                                                                                                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                                    </Button>
                                                                                                </PaginationItem>
                                                                                            );
                                                                                        }

                                                                                        // Show last page
                                                                                        pages.push(
                                                                                            <PaginationItem key={totalPages}>
                                                                                                <Button
                                                                                                    variant={geneCurrentPage === totalPages ? "default" : "outline"}
                                                                                                    size="sm"
                                                                                                    onClick={() => setGeneCurrentPage(totalPages)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                                >
                                                                                                    {totalPages}
                                                                                                </Button>
                                                                                            </PaginationItem>
                                                                                        );
                                                                                    }

                                                                                    return pages;
                                                                                })()}

                                                                                <PaginationItem>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            if (geneCurrentPage < totalPages) {
                                                                                                setGeneCurrentPage(geneCurrentPage + 1);
                                                                                            }
                                                                                        }}
                                                                                        disabled={geneCurrentPage === totalPages}
                                                                                        className="h-8 gap-1 px-2"
                                                                                    >
                                                                                        <span className="hidden sm:inline">Next</span>
                                                                                        <ChevronRight className="h-4 w-4" />
                                                                                    </Button>
                                                                                </PaginationItem>
                                                                            </PaginationContent>
                                                                        </Pagination>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        No gene associations available for this trait
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    );
                                })()}
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
