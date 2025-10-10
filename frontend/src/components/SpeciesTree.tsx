import { Card } from './ui/card';
import { Badge } from './ui/badge';

export function SpeciesTree() {
    return (
        <section className="py-16 px-4 bg-gradient-to-b from-card/30 to-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl mb-3">Evolutionary Conservation Framework</h2>
                    <p className="text-muted-foreground">
                        Phylogenetic relationships and data coverage across mammalian species
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Phylogenetic Tree */}
                    <Card className="p-8 bg-card border-border">
                        <h3 className="text-lg mb-6">Species Phylogeny</h3>
                        <div className="relative h-80">
                            <svg className="w-full h-full" viewBox="0 0 400 300">
                                {/* Tree branches */}
                                <g stroke="#00d4ff" strokeWidth="2" fill="none">
                                    {/* Main trunk */}
                                    <line x1="50" y1="150" x2="150" y2="150" />

                                    {/* Human branch */}
                                    <line x1="150" y1="150" x2="150" y2="80" />
                                    <line x1="150" y1="80" x2="300" y2="80" />

                                    {/* Mouse/Pig common branch */}
                                    <line x1="150" y1="150" x2="150" y2="220" />

                                    {/* Mouse branch */}
                                    <line x1="150" y1="220" x2="200" y2="180" />
                                    <line x1="200" y1="180" x2="300" y2="180" />

                                    {/* Pig branch */}
                                    <line x1="150" y1="220" x2="200" y2="260" />
                                    <line x1="200" y1="260" x2="300" y2="260" />
                                </g>

                                {/* Species labels and data */}
                                <g>
                                    {/* Human */}
                                    <circle cx="300" cy="80" r="8" fill="#00d4ff" />
                                    <text x="320" y="75" fill="#e8eaf0" fontSize="14">Human</text>
                                    <text x="320" y="92" fill="#8b91b0" fontSize="11">Homo sapiens</text>

                                    {/* Mouse */}
                                    <circle cx="300" cy="180" r="8" fill="#00ff88" />
                                    <text x="320" y="175" fill="#e8eaf0" fontSize="14">Mouse</text>
                                    <text x="320" y="192" fill="#8b91b0" fontSize="11">Mus musculus</text>

                                    {/* Pig */}
                                    <circle cx="300" cy="260" r="8" fill="#ff8c42" />
                                    <text x="320" y="255" fill="#e8eaf0" fontSize="14">Pig</text>
                                    <text x="320" y="272" fill="#8b91b0" fontSize="11">Sus scrofa</text>
                                </g>

                                {/* Time scale */}
                                <text x="20" y="290" fill="#8b91b0" fontSize="11">100 MYA</text>
                                <text x="350" y="290" fill="#8b91b0" fontSize="11">Present</text>
                            </svg>
                        </div>
                    </Card>

                    {/* Data Coverage */}
                    <div className="space-y-4">
                        <Card className="p-6 bg-card border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-[#00d4ff] rounded-full" />
                                    <h3 className="text-lg">Human (Homo sapiens)</h3>
                                </div>
                                <Badge variant="secondary">Reference</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Genes</p>
                                    <p className="text-[#00d4ff]">61,471</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Enhancers</p>
                                    <p className="text-[#00d4ff]">121,357</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">GWAS Variants</p>
                                    <p className="text-[#00d4ff]">26,404</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Genome Assembly</p>
                                    <p className="text-[#00d4ff]">GRCh38</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-card border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-[#00ff88] rounded-full" />
                                    <h3 className="text-lg">Mouse (Mus musculus)</h3>
                                </div>
                                <Badge variant="secondary">Model</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Genes</p>
                                    <p className="text-[#00ff88]">78,028</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Enhancers</p>
                                    <p className="text-[#00ff88]">380,841</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Orthologous Genes</p>
                                    <p className="text-[#00ff88]">~17,000</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Genome Assembly</p>
                                    <p className="text-[#00ff88]">GRCm39</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-card border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-[#ff8c42] rounded-full" />
                                    <h3 className="text-lg">Pig (Sus scrofa)</h3>
                                </div>
                                <Badge variant="secondary">Biomedical</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Genes</p>
                                    <p className="text-[#ff8c42]">16,337</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Enhancers</p>
                                    <p className="text-[#ff8c42]">800,013</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Orthologous Genes</p>
                                    <p className="text-[#ff8c42]">~16,000</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Genome Assembly</p>
                                    <p className="text-[#ff8c42]">Sscrofa11.1</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
