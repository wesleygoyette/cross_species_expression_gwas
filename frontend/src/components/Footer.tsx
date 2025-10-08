import { BookOpen, Database, FileCode, Mail, Award, Check, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState } from 'react';

export function Footer() {
    const [copied, setCopied] = useState(false);
    return (
        <footer className="border-t border-border bg-card/30 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* About */}
                    <div>
                        <h3 className="text-sm mb-4">About RegLand</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Cross-species regulatory genomics platform for evolutionary conservation analysis.
                        </p>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Award className="w-4 h-4 mt-0.5 text-[#00d4ff]" />
                            <div>
                                <p className="text-foreground/80 mb-1">Based on peer-reviewed research</p>
                                <p>Berthelot et al. Nature Ecology & Evolution 2018</p>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-sm mb-4">Resources</h3>
                        <div className="space-y-2 text-sm">
                            <a href="#api" className="flex items-center gap-2 text-muted-foreground hover:text-[#00d4ff] transition-colors">
                                <FileCode className="w-4 h-4" />
                                API Documentation
                            </a>
                            <a href="https://github.com/wesleygoyette/cross_species_expression_gwas#readme" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-[#00d4ff] transition-colors">
                                <BookOpen className="w-4 h-4" />
                                Documentation
                            </a>
                        </div>
                    </div>

                    {/* Data Quality */}
                    <div>
                        <h3 className="text-sm mb-4">Data Quality</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Human Gene Coverage</span>
                                    <span className="text-[#00ff88]">96.1%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded overflow-hidden">
                                    <div className="h-full bg-[#00ff88]" style={{ width: '96.1%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Score Completeness</span>
                                    <span className="text-[#00d4ff]">69.6%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded overflow-hidden">
                                    <div className="h-full bg-[#00d4ff]" style={{ width: '69.6%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">GWAS Trait Coverage</span>
                                    <span className="text-[#ff8c42]">100%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded overflow-hidden">
                                    <div className="h-full bg-[#ff8c42]" style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Citation */}
                    <div>
                        <h3 className="text-sm mb-4">Citation</h3>
                        <div className="p-3 bg-muted/30 rounded border border-border text-xs">
                            <p className="mb-2 text-foreground/80">
                                Berthelot C, et al. (2018). "Complexity and conservation of regulatory landscapes underlie evolutionary resilience of mammalian gene expression."
                            </p>
                            <p className="text-muted-foreground mb-3">
                                <em>Nature Ecology & Evolution</em>, 2(1), 152-163.
                            </p>
                            <Button
                                size="sm"
                                variant={copied ? "default" : "outline"}
                                className={`w-full text-xs transition-all ${copied ? 'hover:bg-white/90 text-black' : 'bg-white'}`}
                                onClick={() => {
                                    const bibtex = `@article{berthelot2018regulatory,
  title={Complexity and conservation of regulatory landscapes underlie evolutionary resilience of mammalian gene expression},
  author={Berthelot, Camille and Villar, David and Horvath, James E. and Odom, Duncan T. and Flicek, Paul},
  journal={Nature Ecology \\& Evolution},
  volume={2},
  number={1},
  pages={152--163},
  year={2018},
  doi={10.1038/s41559-017-0377-2},
  publisher={Nature Publishing Group}
}`;
                                    navigator.clipboard.writeText(bibtex).then(() => {
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }).catch(err => {
                                        console.error('Failed to copy BibTeX:', err);
                                    });
                                }}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy BibTeX
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#00d4ff] to-[#00ff88] rounded" />
                            <div>
                                <p className="text-sm">RegLand</p>
                                <p className="text-xs text-muted-foreground">crossgenome.site</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                                <Database className="w-3 h-3 mr-1" />
                                v1.0.2
                            </Badge>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center mt-6">
                        Data for research purposes only. Not intended for clinical use.
                    </p>
                </div>
            </div>
        </footer>
    );
}
