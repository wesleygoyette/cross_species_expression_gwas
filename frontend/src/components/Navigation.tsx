import { Search, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

export function Navigation() {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        if (mobileNavOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileNavOpen]);

    return (
        <>
            <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#00d4ff] to-[#00ff88] rounded" />
                                <div>
                                    <h1 className="text-[#00d4ff] tracking-tight">RegLand</h1>
                                    <p className="text-xs text-muted-foreground" style={{ fontSize: '0.60rem' }}>Cross-Species Regulatory Genomics</p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="/" className="text-sm font-medium text-foreground/70 hover:text-[#00d4ff] transition-colors">Home</a>
                            <a href="#guide" className="text-sm font-medium text-foreground/70 hover:text-[#00d4ff] transition-colors">Getting Started</a>
                            <a href="#gwas" className="text-sm font-medium text-foreground/70 hover:text-[#00d4ff] transition-colors">GWAS Portal</a>
                            <a href="#gene-explorer" className="text-sm font-medium text-foreground/70 hover:text-[#00d4ff] transition-colors">Gene Explorer</a>
                            <a href="#api" className="text-sm font-medium text-foreground/70 hover:text-[#00d4ff] transition-colors">API</a>
                        </div>

                        <Button
                            className="md:hidden"
                            variant="ghost"
                            size="icon"
                            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                            onClick={() => setMobileNavOpen(!mobileNavOpen)}
                        >
                            {mobileNavOpen ? (
                                <X className="w-5 h-5 text-[#00d4ff]" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Mobile nav portal */}
            {mobileNavOpen && (
                <div className="mobile-nav-portal">
                    <div
                        className="mobile-nav-overlay"
                        onClick={() => setMobileNavOpen(false)}
                    />
                    <div className="mobile-nav-drawer">
                        <div className="flex flex-col h-full">
                            {/* Navigation Links */}
                            <nav className="flex flex-col gap-2 p-6 flex-1">
                                <a
                                    href="/"
                                    className="text-base font-medium text-foreground/90 hover:text-[#00d4ff] transition-all px-4 py-3 rounded-lg hover:bg-[#00d4ff]/10 border border-transparent hover:border-[#00d4ff]/20"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    Home
                                </a>
                                <a
                                    href="#guide"
                                    className="text-base font-medium text-foreground/90 hover:text-[#00d4ff] transition-all px-4 py-3 rounded-lg hover:bg-[#00d4ff]/10 border border-transparent hover:border-[#00d4ff]/20"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    Getting Started
                                </a>
                                <a
                                    href="#gwas"
                                    className="text-base font-medium text-foreground/90 hover:text-[#00d4ff] transition-all px-4 py-3 rounded-lg hover:bg-[#00d4ff]/10 border border-transparent hover:border-[#00d4ff]/20"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    GWAS Portal
                                </a>
                                <a
                                    href="#gene-explorer"
                                    className="text-base font-medium text-foreground/90 hover:text-[#00d4ff] transition-all px-4 py-3 rounded-lg hover:bg-[#00d4ff]/10 border border-transparent hover:border-[#00d4ff]/20"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    Gene Explorer
                                </a>
                                <a
                                    href="#api"
                                    className="text-base font-medium text-foreground/90 hover:text-[#00d4ff] transition-all px-4 py-3 rounded-lg hover:bg-[#00d4ff]/10 border border-transparent hover:border-[#00d4ff]/20"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    API
                                </a>
                            </nav>

                            {/* Footer */}
                            <div className="p-6 border-t border-[#00d4ff]/20">
                                <p className="text-xs text-muted-foreground text-center">
                                    Cross-Species Regulatory Genomics
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .mobile-nav-portal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 9999;
                    pointer-events: none;
                }
                
                .mobile-nav-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    pointer-events: all;
                }
                
                .mobile-nav-drawer {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 18rem;
                    background: linear-gradient(to bottom, #0a0f1c, #0f1419, #0a0f1c);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    border-left: 1px solid rgba(0, 212, 255, 0.2);
                    animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: all;
                }
                
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @media (min-width: 768px) {
                    .mobile-nav-portal {
                        display: none;
                    }
                }
                
                @media (max-width: 850px) {
                    .logo-subtext-responsive {
                        display: none !important;
                    }
                }
                
                @media (min-width: 850px) {
                    .logo-text-responsive {
                        color: #00d4ff
                    }
                }
            `}</style>
        </>
    );
}