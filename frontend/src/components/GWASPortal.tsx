import { useState } from 'react';
import { Search, TrendingUp, Network } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function GWASPortal() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Traits', count: 790, color: '#00d4ff' },
    { id: 'metabolic', name: 'Metabolic', count: 156, color: '#00ff88' },
    { id: 'neurological', name: 'Neurological', count: 98, color: '#ff8c42' },
    { id: 'immune', name: 'Immune', count: 124, color: '#a855f7' },
    { id: 'cardiovascular', name: 'Cardiovascular', count: 87, color: '#ec4899' },
  ];

  const traits = [
    { name: 'Body Mass Index (BMI)', snps: 2847, genes: 412, category: 'metabolic', pValue: '5.2e-89' },
    { name: "Alzheimer's Disease", snps: 1243, genes: 156, category: 'neurological', pValue: '2.1e-76' },
    { name: 'Rheumatoid Arthritis', snps: 987, genes: 234, category: 'immune', pValue: '8.4e-65' },
    { name: 'Type 2 Diabetes', snps: 3421, genes: 521, category: 'metabolic', pValue: '1.2e-92' },
    { name: 'Coronary Artery Disease', snps: 1876, genes: 298, category: 'cardiovascular', pValue: '3.5e-71' },
    { name: 'Schizophrenia', snps: 2145, genes: 367, category: 'neurological', pValue: '6.8e-84' },
    { name: 'Crohn\'s Disease', snps: 1567, genes: 189, category: 'immune', pValue: '4.2e-58' },
    { name: 'LDL Cholesterol', snps: 2234, genes: 334, category: 'metabolic', pValue: '1.9e-88' },
  ];

  const filteredTraits = selectedCategory === 'all' 
    ? traits 
    : traits.filter(t => t.category === selectedCategory);

  return (
    <section id="gwas" className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl mb-3">GWAS Disease Portal</h2>
          <p className="text-muted-foreground">
            Explore 26,404 disease-associated variants across 790 human traits
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-[#0a0e27]' : ''}
            >
              {cat.name}
              <Badge variant="secondary" className="ml-2">
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Traits List */}
          <div className="lg:col-span-1 space-y-3">
            <Card className="p-4 bg-card border-border">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search traits..." className="pl-10" />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredTraits.map((trait) => (
                  <div
                    key={trait.name}
                    className="p-3 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-[#00d4ff]/30"
                  >
                    <h4 className="text-sm mb-2">{trait.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{trait.snps} SNPs</span>
                      <span>{trait.genes} genes</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">p-value:</span>
                      <code className="text-xs text-[#00ff88] font-mono">{trait.pValue}</code>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <Tabs defaultValue="snps" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="snps">SNP Mapping</TabsTrigger>
                  <TabsTrigger value="network">Disease Network</TabsTrigger>
                  <TabsTrigger value="genes">Associated Genes</TabsTrigger>
                </TabsList>

                <TabsContent value="snps" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg">SNP-to-Gene Mapping</h3>
                    <Badge variant="secondary">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      High confidence
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {[
                      { snp: 'rs429358', chr: 'chr19', pos: '45411941', gene: 'APOE', effect: 'Missense', odds: '3.68' },
                      { snp: 'rs7412', chr: 'chr19', pos: '45412079', gene: 'APOE', effect: 'Missense', odds: '2.94' },
                      { snp: 'rs6265', chr: 'chr11', pos: '27679916', gene: 'BDNF', effect: 'Missense', odds: '1.42' },
                      { snp: 'rs1799971', chr: 'chr6', pos: '154039662', gene: 'OPRM1', effect: 'Synonymous', odds: '1.28' },
                    ].map((item) => (
                      <div
                        key={item.snp}
                        className="p-4 bg-muted/30 rounded border border-border hover:border-[#00d4ff]/30 transition-colors"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">SNP ID</p>
                            <code className="text-[#00d4ff] font-mono">{item.snp}</code>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Location</p>
                            <code className="text-xs font-mono">{item.chr}:{item.pos}</code>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Gene</p>
                            <span className="text-[#00ff88]">{item.gene}</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Odds Ratio</p>
                            <span className="text-[#ff8c42]">{item.odds}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">{item.effect}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="network" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg">Disease Network Graph</h3>
                    <Button size="sm" variant="outline">
                      <Network className="w-4 h-4 mr-2" />
                      Expand
                    </Button>
                  </div>

                  <div className="h-96 bg-muted/30 rounded border border-border relative overflow-hidden">
                    <svg className="w-full h-full">
                      {/* Network visualization */}
                      {/* Central node */}
                      <circle cx="50%" cy="50%" r="30" fill="#00d4ff" opacity="0.8" />
                      <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="white" fontSize="12">
                        BMI
                      </text>

                      {/* Connected nodes */}
                      {[
                        { x: '30%', y: '30%', label: 'T2D', color: '#00ff88' },
                        { x: '70%', y: '30%', label: 'CAD', color: '#ff8c42' },
                        { x: '30%', y: '70%', label: 'Lipids', color: '#a855f7' },
                        { x: '70%', y: '70%', label: 'HTN', color: '#ec4899' },
                      ].map((node, i) => (
                        <g key={i}>
                          <line
                            x1="50%"
                            y1="50%"
                            x2={node.x}
                            y2={node.y}
                            stroke="#00d4ff"
                            strokeWidth="1"
                            opacity="0.3"
                          />
                          <circle cx={node.x} cy={node.y} r="20" fill={node.color} opacity="0.7" />
                          <text x={node.x} y={node.y} textAnchor="middle" dy=".3em" fill="white" fontSize="10">
                            {node.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#00d4ff] rounded-full" />
                      <span className="text-muted-foreground">Primary trait</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#00ff88] rounded-full" />
                      <span className="text-muted-foreground">Related traits</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="genes" className="space-y-4">
                  <h3 className="text-lg mb-4">Top Associated Genes</h3>
                  <div className="space-y-2">
                    {[
                      { gene: 'FTO', score: 94, snps: 234, traits: 12 },
                      { gene: 'MC4R', score: 89, snps: 187, traits: 8 },
                      { gene: 'TMEM18', score: 86, snps: 156, traits: 6 },
                      { gene: 'GNPDA2', score: 82, snps: 143, traits: 5 },
                      { gene: 'BDNF', score: 78, snps: 129, traits: 9 },
                    ].map((item) => (
                      <div
                        key={item.gene}
                        className="p-3 bg-muted/30 rounded border border-border hover:border-[#00d4ff]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm text-[#00d4ff]">{item.gene}</h4>
                          <Badge variant="secondary">Score: {item.score}</Badge>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{item.snps} SNPs</span>
                          <span>{item.traits} traits</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88]"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
