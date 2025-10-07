import { Search, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Navigation() {
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00d4ff] to-[#00ff88] rounded" />
              <div>
                <h1 className="text-[#00d4ff] tracking-tight">RegLand</h1>
                <p className="text-xs text-muted-foreground">Cross-Species Regulatory Genomics</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="/" className="text-sm text-foreground/80 hover:text-[#00d4ff] transition-colors">Home</a>
              <a href="#gene-explorer" className="text-sm text-foreground/80 hover:text-[#00d4ff] transition-colors">Gene Explorer</a>
              <a href="#gwas" className="text-sm text-foreground/80 hover:text-[#00d4ff] transition-colors">GWAS Portal</a>
              <a href="#regulatory" className="text-sm text-foreground/80 hover:text-[#00d4ff] transition-colors">Regulatory Analyzer</a>
              <a href="#api" className="text-sm text-foreground/80 hover:text-[#00d4ff] transition-colors">API</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-input-background rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search genes, SNPs, traits..."
                className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-muted-foreground"
              />
            </div>
            <Button className="md:hidden" variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
