import { Database, Dna, Activity, Target } from 'lucide-react';

export function StatsDashboard() {
    const stats = [
        {
            icon: Dna,
            label: 'Genes Analyzed',
            value: '195,977',
            subtext: '141,798 unique symbols',
            color: '#00d4ff',
        },
        {
            icon: Database,
            label: 'Regulatory Elements',
            value: '3.9M',
            subtext: 'Cross-species enhancers',
            color: '#00ff88',
        },
        {
            icon: Activity,
            label: 'Human Traits',
            value: '790',
            subtext: '26,404 GWAS variants',
            color: '#ff8c42',
        },
        {
            icon: Target,
            label: 'CTCF Binding Sites',
            value: '89,754',
            subtext: 'Chromatin architecture',
            color: '#a855f7',
        },
    ];

    return (
        <section className="py-16 px-4 bg-gradient-to-b from-card/30 to-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl mb-3">Platform Statistics</h2>
                    <p className="text-muted-foreground">Comprehensive multi-species genomic data integration</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-card border border-border rounded-lg p-6 hover:border-[#00d4ff]/50 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl group-hover:text-[#00d4ff] transition-colors" style={{ color: stat.color }}>
                                    {stat.value}
                                </p>
                                <p className="text-sm text-foreground/80">{stat.label}</p>
                                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 bg-card border border-border rounded-lg p-6">
                    <div className="flex flex-wrap gap-8 justify-center items-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#00d4ff] rounded-full animate-pulse" />
                            <span className="text-muted-foreground">Data Version: v2.1</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#00ff88] rounded-full" />
                            <span className="text-muted-foreground">Last Updated: October 2025</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#ff8c42] rounded-full" />
                            <span className="text-muted-foreground">Species: Human • Mouse • Pig</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
