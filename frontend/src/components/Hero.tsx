import { Button } from './ui/button';
import { ArrowRight, Database, Dna } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 px-4">
            {/* Background gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 via-transparent to-[#00ff88]/5" />
            <div className="absolute top-20 right-20 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#00ff88]/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-full px-4 py-1.5 mb-6">
                            <Dna className="w-4 h-4 text-[#00d4ff]" />
                            <span className="text-sm text-[#00d4ff]">Cross-Species Regulatory Genomics Platform</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 py-2 leading-[1.2] bg-gradient-to-r from-white via-[#00d4ff] to-[#00ff88] bg-clip-text text-transparent font-bold [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
                            Evolutionary Conservation of Gene Regulatory Landscapes
                        </h1>
                        <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
                            Explore <span className="text-[#00d4ff]">3.9 million regulatory elements</span> across human, mouse, and pig genomes.
                            Analyze <span className="text-[#00ff88]">26,404 disease-associated variants</span> spanning <span className="text-[#ff8c42]">790 human traits</span>.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="#gene-explorer" className="bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-[#0a0e27] inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors">
                                Explore Data <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                            <a href="#api" className="border border-[#00d4ff]/30 hover:bg-[#00d4ff]/10 text-foreground inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors">
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 to-[#00ff88]/5" />

            <div className="relative space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs text-muted-foreground">Chromosome 11</p>
                        <p className="font-mono text-sm text-[#00d4ff]">chr11:27,654,894-27,724,285</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Gene: BDNF</p>
                        <p className="text-sm text-[#00ff88]">Brain-Derived Neurotrophic Factor</p>
                    </div>
                </div>

                {/* Human track */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Human</span>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[40%] h-3 bg-[#00d4ff] rounded" />
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#ff8c42]" />
                            <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#ff8c42]" />
                            <div className="absolute left-[55%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#ff8c42]" />
                        </div>
                    </div>
                </div>

                {/* Mouse track */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Mouse</span>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[38%] h-3 bg-[#00d4ff]/70 rounded" />
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]" />
                            <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]" />
                        </div>
                    </div>
                </div>

                {/* Pig track */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Pig</span>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                            <div className="absolute left-[22%] top-1/2 -translate-y-1/2 w-[36%] h-3 bg-[#00d4ff]/50 rounded" />
                            <div className="absolute left-[32%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]/70" />
                            <div className="absolute left-[48%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]/70" />
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
                                const color = height > 70 ? '#00ff88' : height > 40 ? '#00d4ff' : '#8b91b0';
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
                        <div className="w-3 h-3 bg-[#00d4ff] rounded" />
                        <span className="text-muted-foreground">Gene Body</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#ff8c42] rounded" />
                        <span className="text-muted-foreground">Enhancers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#00ff88] rounded" />
                        <span className="text-muted-foreground">Conserved</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
