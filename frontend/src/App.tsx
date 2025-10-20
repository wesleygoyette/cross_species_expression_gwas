import { useEffect } from 'react';
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
    useEffect(() => {
        // Initialize theme on first load
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');

        // Handle hash navigation on initial page load
        const hash = window.location.hash;
        if (hash) {
            // Use setTimeout to ensure all components are rendered
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, []);

    return (
        <div className="min-h-screen">
            <Navigation />
            <main>
                <Hero />
                <QuickGuide />
                <StatsDashboard />
                <GWASPortal />
                <GeneExplorer />
                <SpeciesTree />
                <APIDocumentation />
            </main>
            <Footer />
        </div >
    );
}
