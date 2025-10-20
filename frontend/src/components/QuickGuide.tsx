import { BookOpen, Search, Dna, FlaskConical, Database, ArrowRight, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function QuickGuide() {
    const features = [
        {
            icon: Search,
            title: "GWAS Portal",
            description: "Search and discover genes linked to 790+ diseases and traits. Browse through genome-wide association studies to find genes of interest",
            color: "text-blue-500",
            example: "Search for diseases like Alzheimer's, diabetes, or schizophrenia to find associated genes"
        },
        {
            icon: Dna,
            title: "Gene Explorer",
            description: "Visualize your gene of interest with interactive graphs, genome browsers, and expression data across tissues and species",
            color: "text-purple-500",
            example: "View detailed visualizations for genes like BDNF, FOXP2, or TP53"
        },
        {
            icon: FlaskConical,
            title: "Cross-Species Analysis",
            description: "Compare regulatory elements and expression patterns between human, mouse, and pig to understand evolutionary conservation",
            color: "text-green-500",
            example: "See which regulatory elements are shared across species"
        }
    ];

    const steps = [
        {
            number: 1,
            title: "Search for Diseases or Genes",
            content: "Start with the GWAS Portal to search diseases and find associated genes, or jump directly to Gene Explorer if you already know which gene to analyze."
        },
        {
            number: 2,
            title: "Visualize Gene Data",
            content: "Use the Gene Explorer to see interactive graphs, expression levels, and genome browser views for your gene across different tissues and species."
        },
        {
            number: 3,
            title: "Compare Across Species",
            content: "View how regulatory elements and expression patterns are conserved between human, mouse, and pig to understand evolutionary importance."
        },
        {
            number: 4,
            title: "Analyze and Export",
            content: "Explore detailed visualizations, connect regulatory patterns to disease context, and capture insights to inform your research or experiments."
        }
    ];

    const quickTips = [
        {
            term: "Enhancers",
            definition: "DNA regions that control when and where genes are active. Often located far from the genes they regulate."
        },
        {
            term: "Conservation",
            definition: "When DNA sequences are similar across species, suggesting they're important and preserved through evolution."
        },
        {
            term: "GWAS SNPs",
            definition: "Genetic variants (changes in single DNA letters) that are associated with diseases or traits in humans."
        },
        {
            term: "Expression",
            definition: "How active a gene is in a specific tissue. Higher expression means more gene product is being made."
        }
    ];

    return (
        <section id="guide" className="py-20 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 border-0" style={{ background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', padding: '6px 12px' }}>
                        <BookOpen className="w-3 h-3 mr-1" />
                        Getting Started
                    </Badge>
                    <h2 className="text-4xl font-bold mb-4" style={{
                        background: 'linear-gradient(to right, var(--foreground) 0%, var(--primary) 40%, var(--primary) 70%, var(--genomic-green) 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>
                        Explore Gene Regulation Across Species
                    </h2>
                    <p className="text-xl max-w-3xl mx-auto mb-12" style={{ color: '#8b91b0', lineHeight: '1.7' }}>
                        Discover how genes are controlled in different species and understand the genetic basis of human diseases.
                        No genomics expertise required – we'll guide you through it.
                    </p>
                </div>

                {/* How to Use */}
                <Card className="mb-12 shadow-lg border bg-card dark:bg-black/40" style={{ borderColor: 'rgba(0, 212, 255, 0.15)' }}>
                    <CardHeader className="mb-4">
                        <CardTitle className="text-3xl mb-2 text-[#00d4ff]">How to Use This Platform</CardTitle>
                        <CardDescription className="text-base text-muted-foreground">Follow these simple steps to start exploring genomic data</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 pb-8">
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {steps.map((step, idx) => {
                                const colors = [
                                    { bg: 'rgba(0, 212, 255, 0.1)', ring: '#00d4ff', text: '#00d4ff' },
                                    { bg: 'rgba(168, 85, 247, 0.1)', ring: '#a855f7', text: '#a855f7' },
                                    { bg: 'rgba(0, 255, 136, 0.1)', ring: '#00ff88', text: '#00ff88' },
                                    { bg: 'rgba(255, 140, 66, 0.1)', ring: '#ff8c42', text: '#ff8c42' }
                                ];
                                return (
                                    <div key={idx} className="relative">
                                        <div className="flex h-full flex-col rounded-xl p-6 shadow-md"
                                            style={{
                                                background: colors[idx].bg,
                                                transform: 'scale(1)',
                                                transition: 'transform 0.2s ease',
                                                border: `1px solid ${colors[idx].ring}30`
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                            <div className="mb-4 flex items-start gap-3">
                                                <div className="flex-shrink-0 flex items-center justify-center rounded-full text-lg font-bold dark:text-background"
                                                    style={{
                                                        background: colors[idx].ring,
                                                        color: '#0a0e27',
                                                        boxShadow: `0 4px 12px ${colors[idx].ring}40`,
                                                        width: '48px',
                                                        height: '48px',
                                                        minWidth: '48px',
                                                        minHeight: '48px'
                                                    }}>
                                                    {step.number}
                                                </div>
                                                <h3 className="text-base font-semibold leading-tight pt-2" style={{ color: colors[idx].text }}>{step.title}</h3>
                                            </div>
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                {step.content}
                                            </p>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <ArrowRight className="hidden lg:block absolute -right-7 top-1/2 h-6 w-6 -translate-y-1/2" style={{ color: 'rgba(0, 212, 255, 0.2)' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Key Concepts */}
                <div className="grid lg:grid-cols-2 gap-8 mb-12">
                    {/* Understanding the Basics */}
                    <Card className="shadow-lg border bg-card dark:bg-black/40" style={{ borderColor: 'rgba(0, 212, 255, 0.15)' }}>
                        <CardHeader className='mb-4'>
                            <CardTitle className="text-xl text-[#00d4ff]">Key Concepts Explained</CardTitle>
                            <CardDescription className="text-muted-foreground">Quick definitions of terms you'll encounter</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {quickTips.map((tip, idx) => (
                                    <div key={idx} className="rounded-lg p-3" style={{
                                        background: 'rgba(0, 212, 255, 0.05)',
                                        borderLeft: '3px solid #00d4ff',
                                        boxShadow: '0 2px 8px rgba(0, 212, 255, 0.1)'
                                    }}>
                                        <h4 className="font-semibold text-sm mb-1 text-[#00d4ff]">{tip.term}</h4>
                                        <p className="text-sm text-muted-foreground">{tip.definition}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* FAQ */}
                    <Card className="shadow-lg border bg-card dark:bg-black/40" style={{ borderColor: 'rgba(0, 212, 255, 0.15)' }}>
                        <CardHeader className='mb-4'>
                            <CardTitle className="text-xl text-[#00ff88]">Frequently Asked Questions</CardTitle>
                            <CardDescription className="text-muted-foreground">Common questions to help you get started</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full space-y-3">
                                <AccordionItem value="item-1" className="rounded-lg px-4 py-1 border" style={{ background: 'rgba(0, 255, 136, 0.05)', borderColor: 'rgba(0, 255, 136, 0.2)' }}>
                                    <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline text-[#00ff88]">
                                        What's the difference between GWAS Portal and Gene Explorer?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm pb-5 pt-3 text-muted-foreground">
                                        GWAS Portal is for searching and discovering - browse diseases to find associated genes.
                                        Gene Explorer is for visualization - once you have a gene, see its expression graphs,
                                        genome browser tracks, and regulatory elements across tissues and species.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="rounded-lg px-4 py-1 border" style={{ background: 'rgba(0, 255, 136, 0.05)', borderColor: 'rgba(0, 255, 136, 0.2)' }}>
                                    <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline text-[#00ff88]">
                                        What are the three species covered?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm pb-5 pt-3 text-muted-foreground">
                                        Human (reference for health/disease), mouse (common research model), and pig
                                        (agricultural and biomedical applications). These three species let us understand
                                        which genetic features are universally important in mammals.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3" className="rounded-lg px-4 py-1 border" style={{ background: 'rgba(0, 255, 136, 0.05)', borderColor: 'rgba(0, 255, 136, 0.2)' }}>
                                    <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline text-[#00ff88]">
                                        Do I need to know programming to use this?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm pb-5 pt-3 text-muted-foreground">
                                        Not at all! The website is designed to be fully usable through clicking and
                                        searching. However, if you want to analyze large amounts of data, we also provide
                                        an API for programmatic access.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>

                {/* What You Can Do */}
                <div className="grid gap-8 mb-12 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => {
                        const cardColors = [
                            { bg: 'rgba(0, 212, 255, 0.05)', border: 'rgba(0, 212, 255, 0.3)', iconBg: '#00d4ff', glow: 'rgba(0, 212, 255, 0.2)' },
                            { bg: 'rgba(168, 85, 247, 0.05)', border: 'rgba(168, 85, 247, 0.3)', iconBg: '#a855f7', glow: 'rgba(168, 85, 247, 0.2)' },
                            { bg: 'rgba(0, 255, 136, 0.05)', border: 'rgba(0, 255, 136, 0.3)', iconBg: '#00ff88', glow: 'rgba(0, 255, 136, 0.2)' }
                        ];
                        return (
                            <Card key={idx} className="border shadow-lg h-full flex flex-col"
                                style={{
                                    background: cardColors[idx].bg,
                                    borderColor: cardColors[idx].border,
                                    transform: 'scale(1)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = `0 20px 40px ${cardColors[idx].glow}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '';
                                }}>
                                <CardHeader className="flex-1">
                                    <div className="mb-4 rounded-full inline-flex p-3" style={{ background: cardColors[idx].iconBg, width: 'fit-content', boxShadow: `0 4px 12px ${cardColors[idx].glow}` }}>
                                        <feature.icon className="w-7 h-7 text-background dark:text-background" />
                                    </div>
                                    <CardTitle className="text-lg mb-2 text-foreground">{feature.title}</CardTitle>
                                    <CardDescription className="text-sm mb-4 text-muted-foreground">
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto">
                                    <div className="text-xs flex items-start gap-2 p-3 rounded-lg border bg-background/50 dark:bg-black/20" style={{ borderColor: cardColors[idx].border }}>
                                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: cardColors[idx].iconBg }} />
                                        <span className="text-muted-foreground italic">{feature.example}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Call to Action */}
                <div className="mt-12 text-center">
                    <Card className="inline-block border shadow-xl" style={{
                        background: 'rgba(0, 212, 255, 0.05)',
                        borderColor: 'rgba(0, 212, 255, 0.3)',
                        padding: '2px'
                    }}>
                        <CardContent className="pt-6 bg-card dark:bg-black/40" style={{ borderRadius: '8px' }}>
                            <h3 className="text-xl font-semibold mb-2 text-[#00d4ff]">Ready to Start Exploring?</h3>
                            <p className="mb-6 text-muted-foreground" style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
                                Start with GWAS Portal to search diseases, or jump to Gene Explorer to visualize your gene with interactive graphs
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <a href="#gwas">
                                    <Badge variant="default" className="cursor-pointer text-sm py-3 px-6 border-0"
                                        style={{
                                            background: '#00d4ff',
                                            color: '#0a0e27',
                                            boxShadow: '0 4px 12px rgba(0, 212, 255, 0.4)',
                                            transform: 'scale(1)',
                                            transition: 'all 0.2s ease',
                                            fontWeight: '500'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.4)';
                                        }}>
                                        Search GWAS Portal →
                                    </Badge>
                                </a>
                                <a href="https://github.com/wesleygoyette/cross_species_expression_gwas/blob/main/user-guide.md" target="_blank" rel="noopener noreferrer">
                                    <Badge variant="outline" className="cursor-pointer text-sm py-3 px-6"
                                        style={{
                                            background: 'transparent',
                                            borderColor: 'rgba(0, 212, 255, 0.3)',
                                            color: '#00d4ff',
                                            transform: 'scale(1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}>
                                        Read Full Guide
                                    </Badge>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
