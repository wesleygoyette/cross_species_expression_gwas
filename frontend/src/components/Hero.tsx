import { Database, Dna } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 px-4 min-h-screen bg-background">
            {/* Background gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--genomic-blue)]/5 via-transparent to-[var(--genomic-green)]/5" />
            <div className="absolute top-20 right-20 w-96 h-96 bg-[var(--genomic-blue)]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-[var(--genomic-green)]/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div >
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                            <Dna className="w-4 h-4 text-primary" />
                            <span className="text-sm text-primary">Cross-Species Regulatory Genomics Platform</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 py-2 leading-[1.2] font-bold [-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
                            style={{
                                background: 'linear-gradient(to right, var(--foreground) 0%, var(--primary) 40%, var(--primary) 70%, var(--genomic-green) 100%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent'
                            }}>
                            Evolutionary Conservation of Gene Regulatory Landscapes
                        </h1>
                        <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
                            Explore <span className="text-[var(--genomic-blue)]">3.9 million regulatory elements</span> across human, mouse, and pig genomes.
                            Analyze <span className="text-[var(--genomic-green)]">26,404 disease-associated variants</span> spanning <span className="text-[var(--data-orange)]">790 human traits</span>.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="#gwas" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                                Explore Data →
                            </a>
                            <a href="#api" className="border border-primary/30 hover:bg-primary/10 text-foreground inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors">
                                <Database className="mr-2 w-4 h-4" />
                                API Documentation
                            </a>
                        </div>
                    </div>

                    <div className="relative">
                        <GenomicVisualization />
                    </div>
                </div>
            </div>
        </section>
    );
}

function GenomicVisualization() {
    return (
        <div className="relative w-full h-[400px] bg-card border border-border rounded-lg p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--genomic-blue)]/5 to-[var(--genomic-green)]/5" />

            <div className="relative space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs text-muted-foreground">Chromosome 11</p>
                        <p className="font-mono text-sm text-[var(--genomic-blue)]">chr11:27,654,894-27,724,285</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Gene: BDNF</p>
                        <p className="text-sm text-[var(--genomic-green)]">Brain-Derived Neurotrophic Factor</p>
                    </div>
                </div>

                {/* Human track */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Human</span>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[40%] h-3 bg-[var(--genomic-blue)] rounded" />
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--data-orange)]" />
                            <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--data-orange)]" />
                            <div className="absolute left-[55%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--data-orange)]" />
                        </div>
                    </div>
                </div>

                {/* Mouse track */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Mouse</span>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[38%] h-3 bg-[var(--genomic-blue)]/70 rounded" />
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--genomic-green)]" />
                            <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--genomic-green)]" />
                        </div>
                    </div>
                </div>

                {/* Pig track */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Pig</span>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                            <div className="absolute left-[22%] top-1/2 -translate-y-1/2 w-[36%] h-3 bg-[var(--genomic-blue)]/50 rounded" />
                            <div className="absolute left-[32%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--genomic-green)]/70" />
                            <div className="absolute left-[48%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--genomic-green)]/70" />
                        </div>
                    </div>
                </div>

                {/* Conservation track */}
                <div className="space-y-1 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">P-Value</span>
                        <div className="flex-1 h-12 relative">
                            {Array.from({ length: 50 }).map((_, i) => {
                                const height = Math.random() * 100;
                                const color = height > 70 ? 'var(--genomic-green)' : height > 40 ? 'var(--genomic-blue)' : '#8b91b0';
                                return (
                                    <div
                                        key={i}
                                        className="absolute bottom-0"
                                        style={{
                                            left: `${i * 2}%`,
                                            width: '2%',
                                            height: `${height}%`,
                                            backgroundColor: color,
                                            opacity: 0.7,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 text-xs pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[var(--genomic-blue)] rounded" />
                        <span className="text-muted-foreground">Gene Body</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[var(--data-orange)] rounded" />
                        <span className="text-muted-foreground">Enhancers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[var(--genomic-green)] rounded" />
                        <span className="text-muted-foreground">Conserved</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
