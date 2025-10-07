import { BookOpen, Database, FileCode, Mail, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-sm mb-4">About RegLand</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cross-species regulatory genomics platform for evolutionary conservation analysis.
            </p>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Award className="w-4 h-4 mt-0.5 text-[#00d4ff]" />
              <div>
                <p className="text-foreground/80 mb-1">Based on peer-reviewed research</p>
                <p>Berthelot et al. Nature Ecology & Evolution 2018</p>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm mb-4">Resources</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-[#00d4ff] transition-colors">
                <FileCode className="w-4 h-4" />
                API Documentation
              </a>
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-[#00d4ff] transition-colors">
                <Database className="w-4 h-4" />
                Download Data
              </a>
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-[#00d4ff] transition-colors">
                <BookOpen className="w-4 h-4" />
                Documentation
              </a>
            </div>
          </div>

          {/* Data Quality */}
          <div>
            <h3 className="text-sm mb-4">Data Quality</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Annotation Quality</span>
                  <span className="text-[#00ff88]">98.5%</span>
                </div>
                <div className="h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-[#00ff88]" style={{ width: '98.5%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Cross-Species Coverage</span>
                  <span className="text-[#00d4ff]">95.2%</span>
                </div>
                <div className="h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-[#00d4ff]" style={{ width: '95.2%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Validation Rate</span>
                  <span className="text-[#ff8c42]">97.1%</span>
                </div>
                <div className="h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-[#ff8c42]" style={{ width: '97.1%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Citation */}
          <div>
            <h3 className="text-sm mb-4">Citation</h3>
            <div className="p-3 bg-muted/30 rounded border border-border text-xs">
              <p className="mb-2 text-foreground/80">
                Berthelot C, et al. (2018). "The regulatory landscape of vertebrate genomes."
              </p>
              <p className="text-muted-foreground mb-3">
                <em>Nature Ecology & Evolution</em>, 2(10), 1515-1528.
              </p>
              <Button size="sm" variant="outline" className="w-full text-xs">
                Copy BibTeX
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00d4ff] to-[#00ff88] rounded" />
              <div>
                <p className="text-sm">RegLand</p>
                <p className="text-xs text-muted-foreground">crossgenome.site</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                v2.1.0
              </Badge>
              <span>•</span>
              <a href="#" className="hover:text-[#00d4ff] transition-colors">Terms</a>
              <span>•</span>
              <a href="#" className="hover:text-[#00d4ff] transition-colors">Privacy</a>
              <span>•</span>
              <a href="#" className="hover:text-[#00d4ff] transition-colors flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Contact
              </a>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            © 2025 RegLand. Data for research purposes only. Not intended for clinical use.
          </p>
        </div>
      </div>
    </footer>
  );
}
