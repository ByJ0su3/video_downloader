import React, { useState } from 'react';
import { Button } from './ui/button';
import { Menu, X, Download } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg platform-gradient flex items-center justify-center platform-glow">
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-['Space_Grotesk'] text-foreground">LinkRip</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-muted-foreground hover:text-foreground fast-transition"
            >
              Cómo funciona
            </button>
            <button 
              onClick={() => scrollToSection('platforms')}
              className="text-sm text-muted-foreground hover:text-foreground fast-transition"
            >
              Plataformas
            </button>
            <button 
              onClick={() => scrollToSection('mp3-quality')}
              className="text-sm text-muted-foreground hover:text-foreground fast-transition"
            >
              Calidad MP3
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-sm text-muted-foreground hover:text-foreground fast-transition"
            >
              Preguntas
            </button>
            <Button 
              onClick={() => scrollToSection('hero')}
              className="platform-gradient platform-glow"
              size="sm"
            >
              Probar ahora
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-effect border-t border-border/50">
          <div className="px-4 py-4 space-y-3">
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground fast-transition py-2"
            >
              Cómo funciona
            </button>
            <button 
              onClick={() => scrollToSection('platforms')}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground fast-transition py-2"
            >
              Plataformas
            </button>
            <button 
              onClick={() => scrollToSection('mp3-quality')}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground fast-transition py-2"
            >
              Calidad MP3
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground fast-transition py-2"
            >
              Preguntas
            </button>
            <Button 
              onClick={() => scrollToSection('hero')}
              className="w-full platform-gradient platform-glow"
            >
              Probar ahora
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
