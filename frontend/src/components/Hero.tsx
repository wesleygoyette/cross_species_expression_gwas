import { Button } from './ui/button';
import { ArrowRight, Database, Dna } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function Hero() {
    const [isVisible, setIsVisible] = useState(false);
    const [isChartVisible, setIsChartVisible] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        const chartObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsChartVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (heroRef.current) {
            observer.observe(heroRef.current);
        }

        if (chartRef.current) {
            chartObserver.observe(chartRef.current);
        }

        return () => {
            if (heroRef.current) {
                observer.unobserve(heroRef.current);
            }
            if (chartRef.current) {
                chartObserver.unobserve(chartRef.current);
            }
        };
    }, []);

    return (
        <section ref={heroRef} className="relative overflow-hidden py-20 px-4">
            {/* Background gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 via-transparent to-[#00ff88]/5" />
            <div className="absolute top-20 right-20 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#00ff88]/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            fontWeight: 900,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.5,
                            fontFamily: 'Arial, sans-serif',
                            marginBottom: '1.5rem'
                        }}>
                            <span style={{
                                color: 'white',
                                display: 'block',
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
                                transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
                            }}>
                                Evolutionary Conservation of
                            </span>
                            <span style={{
                                display: 'block',
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
                                transition: 'opacity 0.5s ease-out 0.2s, transform 0.5s ease-out 0.2s'
                            }}>
                                <span style={{ color: '#a855f7' }}>Gene </span>
                                <span style={{ color: '#ff8c42' }}>Regulatory </span>
                                <span style={{ color: '#00d4ff' }}>Landscapes</span>
                            </span>
                        </h1>
                        <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-full px-4 py-1.5 mb-6">
                            <Dna className="w-4 h-4 text-[#00d4ff]" />
                            <span className="text-sm text-[#00d4ff]">Cross-Species Regulatory Genomics Platform</span>
                        </div>
                        <p style={{ color: 'white', fontSize: '20px', fontWeight: 400, lineHeight: 1.4 }} className="mb-8">
                            Explore <span style={{ fontStyle: 'italic' }} className="text-[#00d4ff]">3.9 million regulatory elements</span> across human, mouse, and pig genomes.
                            Analyze <span style={{ fontStyle: 'italic' }} className="text-[#00ff88]">26,404 disease-associated variants</span> spanning <span style={{ fontStyle: 'italic' }} className="text-[#ff8c42]">790 human traits</span>.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a
                                href="#gene-explorer"
                                className="inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors"
                                style={{ backgroundColor: '#00d4ff', color: '#0a0e27' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a855f7'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00d4ff'}
                                onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
                                onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#a855f7'}
                            >
                                Explore Data <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                            <a href="#api" className="border border-[#00d4ff]/30 hover:bg-[#00d4ff]/10 text-foreground inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors">
                                <Database className="mr-2 w-4 h-4" />
                                API Documentation
                            </a>
                        </div>
                    </div>

                    <div ref={chartRef} className="relative">
                        <GenomicVisualization isVisible={isChartVisible} />
                    </div>
                </div>
            </div>
        </section>
    );
}

function GenomicVisualization({ isVisible }: { isVisible: boolean }) {
    return (
        <div
            className="relative w-full bg-card border border-border rounded-lg overflow-hidden"
            style={{
                height: '600px',
                padding: '32px',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out'
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 to-[#00ff88]/5" />

            <div className="relative h-full flex flex-col">
                <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
                    <div>
                        <p style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Chromosome 11</p>
                        <p style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace", fontWeight: 300, fontSize: '12px' }} className="text-[#00d4ff]">chr11:27,654,894-27,724,285</p>
                    </div>
                    <div className="text-right">
                        <p style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Gene: BDNF</p>
                        <p style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace", fontWeight: 300, fontSize: '12px' }} className="text-[#00ff88]">Brain-Derived Neurotrophic Factor</p>
                    </div>
                </div>

                {/* Human track */}
                <div style={{ marginBottom: '20px' }}>
                    <div className="flex items-center gap-3">
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }} className="w-16">Human</span>
                        <div className="flex-1 bg-muted/50 rounded relative overflow-hidden" style={{ height: '40px' }}>
                            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[40%] h-3 bg-[#00d4ff] rounded" />
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#ff8c42]" />
                            <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#ff8c42]" />
                            <div className="absolute left-[55%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#ff8c42]" />
                        </div>
                    </div>
                </div>

                {/* Mouse track */}
                <div style={{ marginBottom: '20px' }}>
                    <div className="flex items-center gap-3">
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }} className="w-16">Mouse</span>
                        <div className="flex-1 bg-muted/50 rounded relative overflow-hidden" style={{ height: '40px' }}>
                            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[38%] h-3 bg-[#00d4ff]/70 rounded" />
                            <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]" />
                            <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]" />
                        </div>
                    </div>
                </div>

                {/* Pig track */}
                <div style={{ marginBottom: '24px' }}>
                    <div className="flex items-center gap-3">
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }} className="w-16">Pig</span>
                        <div className="flex-1 bg-muted/50 rounded relative overflow-hidden" style={{ height: '40px' }}>
                            <div className="absolute left-[22%] top-1/2 -translate-y-1/2 w-[36%] h-3 bg-[#00d4ff]/50 rounded" />
                            <div className="absolute left-[32%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]/70" />
                            <div className="absolute left-[48%] top-1/2 -translate-y-1/2 w-2 h-5 bg-[#00ff88]/70" />
                        </div>
                    </div>
                </div>

                {/* Conservation track */}
                <div className="border-t border-border/50" style={{ paddingTop: '24px', marginTop: '8px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700, display: 'block' }}>Conservation</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-16"></div>
                        <div className="flex-1 relative" style={{ height: '120px' }}>
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

                <div className="flex gap-6" style={{ paddingTop: '24px', marginTop: 'auto' }}>
                    <div className="flex items-center gap-2">
                        <div className="rounded" style={{ width: '14px', height: '14px', backgroundColor: '#00d4ff' }} />
                        <span style={{ color: 'white', fontSize: '13px' }}>Gene Body</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="rounded" style={{ width: '14px', height: '14px', backgroundColor: '#ff8c42' }} />
                        <span style={{ color: 'white', fontSize: '13px' }}>Enhancers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="rounded" style={{ width: '14px', height: '14px', backgroundColor: '#00ff88' }} />
                        <span style={{ color: 'white', fontSize: '13px' }}>Conserved</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
