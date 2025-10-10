import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { StatsDashboard } from './components/StatsDashboard';
import { QuickGuide } from './components/QuickGuide';
import { GeneExplorer } from './components/GeneExplorer';
import { GWASPortal } from './components/GWASPortal';
import { SpeciesTree } from './components/SpeciesTree';
import { APIDocumentation } from './components/APIDocumentation';
import { Footer } from './components/Footer';

export default function App() {
    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <main>
                <Hero />
                <QuickGuide />
                <StatsDashboard />
                <GeneExplorer />
                <GWASPortal />
                <SpeciesTree />
                <APIDocumentation />
            </main>
            <Footer />
        </div>
    );
}
