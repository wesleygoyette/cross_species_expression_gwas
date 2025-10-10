import { BookOpen, Search, Dna, FlaskConical, Database, ArrowRight, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function QuickGuide() {
    const features = [
        {
            icon: Search,
            title: "Gene Explorer",
            description: "Search for any gene and explore its regulatory landscape across human, mouse, and pig",
            color: "text-blue-500",
            example: "Try searching for BDNF, FOXP2, or TP53"
        },
        {
            icon: Dna,
            title: "Disease Genetics",
            description: "Discover genetic variants linked to 790+ human diseases and traits from GWAS studies",
            color: "text-purple-500",
            example: "Explore connections between genes and conditions"
        },
        {
            icon: FlaskConical,
            title: "Cross-Species Analysis",
            description: "Compare how gene regulation is conserved across three mammalian species through evolution",
            color: "text-green-500",
            example: "See which regulatory elements are shared"
        }
    ];

    const steps = [
        {
            number: 1,
            title: "Choose Your Starting Point",
            content: "Start by exploring a gene you're interested in, or browse diseases in the GWAS Portal to find associated genes."
        },
        {
            number: 2,
            title: "Select a Tissue Type",
            content: "Different tissues (brain, heart, liver) have different active regulatory elements. Pick the tissue most relevant to your research."
        },
        {
            number: 3,
            title: "Compare Across Species",
            content: "View how regulatory elements are conserved between human, mouse, and pig to understand evolutionary importance."
        },
        {
            number: 4,
            title: "Synthesize Insights",
            content: "Use the genome browser to visualize key regions, connect regulatory patterns to disease context, and capture takeaways to inform your next experiment."
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
        <section id="guide" className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Getting Started
                    </Badge>
                    <h2 className="text-4xl font-bold mb-4">
                        Explore Gene Regulation Across Species
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Discover how genes are controlled in different species and understand the genetic basis of human diseases.
                        No genomics expertise required – we'll guide you through it.
                    </p>
                </div>

                {/* How to Use */}
                <Card className="mb-12 bg-card/60 backdrop-blur border border-border/60 shadow-sm">
                    <CardHeader className="pb-0 text-sm">
                        <CardTitle className="text-3xl mb-1">How to Use This Platform</CardTitle>
                        <CardDescription>Follow these simple steps to start exploring genomic data</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 mb-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {steps.map((step, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex h-full flex-col rounded-xl bg-background/80 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1">
                                        <div className="mb-4 flex items-center gap-4">
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary ring-2 ring-primary/20">
                                                {step.number}
                                            </div>
                                            <h3 className="text-base font-semibold leading-snug">{step.title}</h3>
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {step.content}
                                        </p>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <ArrowRight className="hidden lg:block absolute -right-7 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground/30" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Key Concepts */}
                <div className="grid lg:grid-cols-2 gap-8 mb-12">
                    {/* Understanding the Basics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Key Concepts Explained</CardTitle>
                            <CardDescription>Quick definitions of terms you'll encounter</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {quickTips.map((tip, idx) => (
                                    <div key={idx} className="border-l-2 border-primary/30 pl-4">
                                        <h4 className="font-semibold text-sm mb-1">{tip.term}</h4>
                                        <p className="text-sm text-muted-foreground">{tip.definition}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* FAQ */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
                            <CardDescription>Common questions to help you get started</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full space-y-3">
                                <AccordionItem value="item-1" className="border rounded-lg px-4 py-2">
                                    <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline">
                                        What are the three species covered?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground pb-5 pt-3">
                                        Human (reference for health/disease), mouse (common research model), and pig
                                        (agricultural and biomedical applications). These three species let us understand
                                        which genetic features are universally important in mammals.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border rounded-lg px-4 py-2">
                                    <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline">
                                        Do I need to know programming to use this?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground pb-5 pt-3">
                                        Not at all! The website is designed to be fully usable through clicking and
                                        searching. However, if you want to analyze large amounts of data, we also provide
                                        an API for programmatic access.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3" className="border rounded-lg px-4 py-2">
                                    <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline">
                                        Why doesn't my gene show many results?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground pb-5 pt-3">
                                        Data coverage varies by gene and tissue. Check the data quality badge – some
                                        genes are less studied or harder to sequence. Try different tissues or look
                                        at the species tree to see which organisms have better data.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>

                {/* What You Can Do */}
                <div className="grid gap-6 mb-12 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, idx) => (
                        <Card key={idx} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full flex flex-col">
                            <CardHeader className="flex-1">
                                <feature.icon className={`w-10 h-10 mb-3 ${feature.color}`} />
                                <CardTitle className="text-lg">{feature.title}</CardTitle>
                                <CardDescription className="text-sm">
                                    {feature.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <div className="text-xs text-muted-foreground italic flex items-start gap-2">
                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{feature.example}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="mt-12 text-center">
                    <Card className="inline-block bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <h3 className="text-xl font-semibold mb-2">Ready to Start Exploring?</h3>
                            <p className="text-muted-foreground mb-4">
                                Scroll down to try the Gene Explorer or check the full user guide for detailed instructions
                            </p>
                            <div className="flex gap-3 justify-center flex-wrap">
                                <a href="#gene-explorer">
                                    <Badge variant="default" className="cursor-pointer text-sm py-2 px-4 hover:bg-primary/90">
                                        Try Gene Explorer →
                                    </Badge>
                                </a>
                                <a href="https://github.com/wesleygoyette/cross_species_expression_gwas/blob/main/user-guide.md" target="_blank" rel="noopener noreferrer">
                                    <Badge variant="outline" className="cursor-pointer text-sm py-2 px-4 hover:bg-muted">
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
