import { useState } from 'react';
import { Search, Download, Filter, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';

export function GeneExplorer() {
  const [selectedGene, setSelectedGene] = useState('BDNF');

  const exampleGenes = ['BDNF', 'FOXP2', 'ALB', 'PCSK9', 'TP53', 'APOE'];
  
  const geneData = {
    BDNF: {
      fullName: 'Brain-Derived Neurotrophic Factor',
      chromosome: 'chr11',
      position: '27,654,894-27,724,285',
      enhancers: 12,
      conservation: 89,
      species: ['Human', 'Mouse', 'Pig'],
    },
    FOXP2: {
      fullName: 'Forkhead Box P2',
      chromosome: 'chr7',
      position: '114,086,327-114,693,772',
      enhancers: 8,
      conservation: 94,
      species: ['Human', 'Mouse', 'Pig'],
    },
    ALB: {
      fullName: 'Albumin',
      chromosome: 'chr4',
      position: '73,404,256-73,421,412',
      enhancers: 15,
      conservation: 76,
      species: ['Human', 'Mouse', 'Pig'],
    },
    PCSK9: {
      fullName: 'Proprotein Convertase Subtilisin/Kexin Type 9',
      chromosome: 'chr1',
      position: '55,039,475-55,064,852',
      enhancers: 6,
      conservation: 82,
      species: ['Human', 'Mouse'],
    },
  };

  const currentGene = geneData[selectedGene as keyof typeof geneData] || geneData.BDNF;

  return (
    <section id="gene-explorer" className="py-16 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl mb-3">Gene Explorer</h2>
          <p className="text-muted-foreground">Search and analyze gene regulatory landscapes across species</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 bg-card border-border">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search gene symbol..." 
                    className="pl-10"
                    defaultValue={selectedGene}
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Example genes:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleGenes.map((gene) => (
                      <Button
                        key={gene}
                        variant={selectedGene === gene ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedGene(gene)}
                        className={selectedGene === gene ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-[#0a0e27]' : ''}
                      >
                        {gene}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>
              </div>
            </Card>

            {/* Gene Info */}
            <Card className="p-4 bg-card border-border">
              <div className="space-y-3">
                <div>
                  <h3 className="text-[#00d4ff] mb-1">{selectedGene}</h3>
                  <p className="text-sm text-muted-foreground">{currentGene.fullName}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-mono text-xs">{currentGene.chromosome}:{currentGene.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enhancers:</span>
                    <Badge variant="secondary">{currentGene.enhancers}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conservation:</span>
                    <span className="text-[#00ff88]">{currentGene.conservation}%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Available in:</p>
                  <div className="flex gap-2">
                    {currentGene.species.map((species) => (
                      <Badge key={species} variant="outline" className="text-xs">
                        {species}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <Tabs defaultValue="tracks" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="tracks">Genome Tracks</TabsTrigger>
                  <TabsTrigger value="conservation">Conservation</TabsTrigger>
                  <TabsTrigger value="expression">Expression</TabsTrigger>
                </TabsList>

                <TabsContent value="tracks" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg">Multi-Species Genome Browser</h3>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {/* Tissue selector */}
                  <div className="flex gap-2 mb-6">
                    {['Brain', 'Heart', 'Liver'].map((tissue) => (
                      <Button
                        key={tissue}
                        variant="outline"
                        size="sm"
                        className="hover:bg-[#00d4ff]/10 hover:border-[#00d4ff]"
                      >
                        {tissue}
                      </Button>
                    ))}
                  </div>

                  {/* Genome tracks */}
                  <div className="space-y-6">
                    {['Human', 'Mouse', 'Pig'].map((species, idx) => (
                      <div key={species} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm">{species}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {species === 'Human' ? '100%' : species === 'Mouse' ? '87%' : '79%'} identity
                          </Badge>
                        </div>
                        
                        <div className="h-24 bg-muted/30 rounded border border-border relative overflow-hidden">
                          {/* Gene body */}
                          <div 
                            className="absolute top-6 h-8 bg-[#00d4ff]/60 rounded"
                            style={{ left: '15%', width: '50%' }}
                          />
                          
                          {/* Enhancers */}
                          {Array.from({ length: currentGene.enhancers }).map((_, i) => (
                            <div
                              key={i}
                              className="absolute top-4 w-1.5 h-12 bg-[#ff8c42]"
                              style={{ 
                                left: `${20 + (i * 5)}%`,
                                opacity: 1 - (idx * 0.2)
                              }}
                            />
                          ))}

                          {/* Scale */}
                          <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground font-mono">
                            <span>{currentGene.position.split('-')[0]}</span>
                            <span>{currentGene.position.split('-')[1]}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="conservation" className="space-y-4">
                  <h3 className="text-lg mb-4">Conservation Heatmap</h3>
                  <div className="h-64 bg-muted/30 rounded border border-border p-4">
                    <div className="grid grid-cols-10 gap-1 h-full">
                      {Array.from({ length: 100 }).map((_, i) => {
                        const conservation = 50 + Math.random() * 50;
                        const color = conservation > 85 ? '#00ff88' : conservation > 70 ? '#00d4ff' : conservation > 50 ? '#ff8c42' : '#8b91b0';
                        return (
                          <div
                            key={i}
                            className="rounded"
                            style={{ 
                              backgroundColor: color,
                              opacity: conservation / 100
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">Low</span>
                    <div className="flex-1 h-2 bg-gradient-to-r from-[#8b91b0] via-[#ff8c42] via-[#00d4ff] to-[#00ff88] rounded" />
                    <span className="text-muted-foreground">High</span>
                  </div>
                </TabsContent>

                <TabsContent value="expression" className="space-y-4">
                  <h3 className="text-lg mb-4">Tissue Expression Profile</h3>
                  <div className="space-y-3">
                    {[
                      { tissue: 'Brain', value: 92 },
                      { tissue: 'Heart', value: 45 },
                      { tissue: 'Liver', value: 28 },
                      { tissue: 'Kidney', value: 38 },
                      { tissue: 'Lung', value: 56 },
                    ].map((item) => (
                      <div key={item.tissue} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.tissue}</span>
                          <span className="text-muted-foreground">{item.value} TPM</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88]"
                            style={{ width: `${item.value}%` }}
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
