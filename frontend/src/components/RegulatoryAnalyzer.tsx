import { useState } from 'react';
import { Filter, Download, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

export function RegulatoryAnalyzer() {
  const [selectedTissue, setSelectedTissue] = useState('brain');
  const [conservation, setConservation] = useState([70]);

  const tissues = [
    { id: 'brain', name: 'Brain', enhancers: 45234, color: '#00d4ff' },
    { id: 'heart', name: 'Heart', enhancers: 32145, color: '#00ff88' },
    { id: 'liver', name: 'Liver', enhancers: 38976, color: '#ff8c42' },
    { id: 'kidney', name: 'Kidney', enhancers: 29876, color: '#a855f7' },
  ];

  const currentTissue = tissues.find(t => t.id === selectedTissue) || tissues[0];

  return (
    <section id="regulatory" className="py-16 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl mb-3">Regulatory Landscape Analyzer</h2>
          <p className="text-muted-foreground">
            Explore tissue-specific enhancers and chromatin architecture across species
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 bg-card border-border">
              <h3 className="text-sm mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Tissue Type</label>
                  <Select value={selectedTissue} onValueChange={setSelectedTissue}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tissues.map((tissue) => (
                        <SelectItem key={tissue.id} value={tissue.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tissue.color }} />
                            {tissue.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Conservation Threshold: {conservation[0]}%
                  </label>
                  <Slider
                    value={conservation}
                    onValueChange={setConservation}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Species</label>
                  <div className="space-y-2">
                    {['Human', 'Mouse', 'Pig'].map((species) => (
                      <label key={species} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>{species}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <h3 className="text-sm mb-3">Current Selection</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tissue:</span>
                  <span style={{ color: currentTissue.color }}>{currentTissue.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enhancers:</span>
                  <Badge variant="secondary">{currentTissue.enhancers.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CTCF Sites:</span>
                  <Badge variant="secondary">12,456</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Visualization */}
          <div className="lg:col-span-3 space-y-6">
            {/* Enhancer View */}
            <Card className="p-6 bg-card border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg">Tissue-Specific Enhancer Landscape</h3>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export BED
                </Button>
              </div>

              <div className="space-y-6">
                {/* Enhancer tracks for each species */}
                {['Human', 'Mouse', 'Pig'].map((species, idx) => (
                  <div key={species} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm">{species}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Layers className="w-3 h-3 mr-1" />
                          {Math.floor(Math.random() * 500 + 200)} enhancers
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="h-20 bg-muted/30 rounded border border-border relative overflow-hidden">
                      {/* Active enhancers */}
                      {Array.from({ length: 15 }).map((_, i) => {
                        const width = Math.random() * 4 + 2;
                        const left = Math.random() * 90;
                        const opacity = 1 - (idx * 0.25);
                        return (
                          <div
                            key={i}
                            className="absolute top-1/2 -translate-y-1/2 h-10 rounded"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              backgroundColor: currentTissue.color,
                              opacity: opacity
                            }}
                          />
                        );
                      })}
                      
                      {/* CTCF binding sites */}
                      {Array.from({ length: 8 }).map((_, i) => {
                        const left = Math.random() * 95;
                        return (
                          <div
                            key={i}
                            className="absolute top-0 w-px h-full bg-[#a855f7]"
                            style={{ left: `${left}%`, opacity: 0.6 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-6 text-xs mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: currentTissue.color }} />
                  <span className="text-muted-foreground">Active enhancers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-px bg-[#a855f7]" />
                  <span className="text-muted-foreground">CTCF sites</span>
                </div>
              </div>
            </Card>

            {/* 3D Chromatin Architecture */}
            <Card className="p-6 bg-card border-border">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg">3D Chromatin Architecture</h3>
                  <p className="text-xs text-muted-foreground mt-1">CTCF-mediated loops and TAD boundaries</p>
                </div>
                <Badge variant="secondary">89,754 CTCF sites</Badge>
              </div>

              <div className="h-64 bg-muted/30 rounded border border-border relative overflow-hidden">
                <svg className="w-full h-full">
                  {/* Draw chromatin loops */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const x1 = 10 + i * 140;
                    const x2 = x1 + 80 + Math.random() * 60;
                    const y = 200;
                    const height = 60 + Math.random() * 80;
                    
                    return (
                      <g key={i}>
                        {/* Loop arc */}
                        <path
                          d={`M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - height} ${x2} ${y}`}
                          stroke="#00d4ff"
                          strokeWidth="2"
                          fill="none"
                          opacity="0.5"
                        />
                        {/* CTCF anchors */}
                        <circle cx={x1} cy={y} r="4" fill="#a855f7" />
                        <circle cx={x2} cy={y} r="4" fill="#a855f7" />
                      </g>
                    );
                  })}
                  
                  {/* Baseline */}
                  <line x1="0" y1="200" x2="100%" y2="200" stroke="#8b91b0" strokeWidth="1" opacity="0.3" />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Loop Count</p>
                  <p className="text-[#00d4ff]">2,847</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">TAD Boundaries</p>
                  <p className="text-[#00ff88]">1,234</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Avg Loop Size</p>
                  <p className="text-[#ff8c42]">340 kb</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
