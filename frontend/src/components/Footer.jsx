import React from 'react';
import { Download } from 'lucide-react';

const Footer = ({ language }) => {
  const copy = {
    es: {
      description: 'La forma mas rapida de descargar videos y convertir a MP3 desde tus plataformas favoritas.',
      home: 'Inicio',
      how: 'Como funciona',
      platforms: 'Plataformas',
      faq: 'Preguntas',
      privacy: 'Politica de privacidad',
      contact: 'Contacto',
      rights: '2026 LinkRip. Todos los derechos reservados.',
    },
    en: {
      description: 'The fastest way to download videos and convert to MP3 from your favorite platforms.',
      home: 'Home',
      how: 'How it works',
      platforms: 'Platforms',
      faq: 'FAQ',
      privacy: 'Privacy policy',
      contact: 'Contact',
      rights: '2026 LinkRip. All rights reserved.',
    },
  };

  const t = copy[language];

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center gap-5 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg platform-gradient flex items-center justify-center platform-glow">
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-['Space_Grotesk']">LinkRip</span>
          </div>

          <p className="text-sm text-muted-foreground max-w-xl">{t.description}</p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-foreground fast-transition"
            >
              {t.home}
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground fast-transition"
            >
              {t.how}
            </button>
            <button
              onClick={() => document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground fast-transition"
            >
              {t.platforms}
            </button>
            <button
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground fast-transition"
            >
              {t.faq}
            </button>
            <a href="#" className="hover:text-foreground fast-transition">
              {t.privacy}
            </a>
            <a href="#" className="hover:text-foreground fast-transition">
              {t.contact}
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">{t.rights}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
