import { Search, Menu, X, Dna } from 'lucide-react';
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
                <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
                    <div className="flex items-center justify-between" style={{ height: '80px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Dna style={{ width: '48px', height: '48px', color: '#a855f7', strokeWidth: '0.5', display: 'inline-block' }} />
                            <h1 className="tracking-tight font-bold" style={{ fontSize: '48px', color: '#00d4ff', lineHeight: '1', display: 'inline-block' }}>Genexus</h1>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="/" className="text-sm font-medium transition-colors" style={{ color: '#00d4ff' }} onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'} onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}>Home</a>
                            <a href="#guide" className="text-sm font-medium transition-colors" style={{ color: '#00d4ff' }} onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'} onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}>Getting Started</a>
                            <a href="#gwas" className="text-sm font-medium transition-colors" style={{ color: '#00d4ff' }} onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'} onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}>GWAS Portal</a>
                            <a href="#gene-explorer" className="text-sm font-medium transition-colors" style={{ color: '#00d4ff' }} onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'} onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}>Gene Explorer</a>
                            <a href="#api" className="text-sm font-medium transition-colors" style={{ color: '#00d4ff' }} onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'} onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}>API</a>
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
                                    className="text-base font-medium transition-all px-4 py-3 rounded-lg"
                                    style={{ color: '#00d4ff', backgroundColor: 'transparent', border: '1px solid transparent' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#f97316';
                                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#00d4ff';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    Home
                                </a>
                                <a
                                    href="#guide"
                                    className="text-base font-medium transition-all px-4 py-3 rounded-lg"
                                    style={{ color: '#00d4ff', backgroundColor: 'transparent', border: '1px solid transparent' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#f97316';
                                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#00d4ff';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    Getting Started
                                </a>
                                <a
                                    href="#gwas"
                                    className="text-base font-medium transition-all px-4 py-3 rounded-lg"
                                    style={{ color: '#00d4ff', backgroundColor: 'transparent', border: '1px solid transparent' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#f97316';
                                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#00d4ff';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    GWAS Portal
                                </a>
                                <a
                                    href="#gene-explorer"
                                    className="text-base font-medium transition-all px-4 py-3 rounded-lg"
                                    style={{ color: '#00d4ff', backgroundColor: 'transparent', border: '1px solid transparent' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#f97316';
                                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#00d4ff';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    Gene Explorer
                                </a>
                                <a
                                    href="#api"
                                    className="text-base font-medium transition-all px-4 py-3 rounded-lg"
                                    style={{ color: '#00d4ff', backgroundColor: 'transparent', border: '1px solid transparent' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#f97316';
                                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#00d4ff';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
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