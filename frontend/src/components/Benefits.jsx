import React from 'react';
import { Card } from './ui/card';
import { Zap, Palette, Grid3x3, Shield, Smartphone, FileCheck } from 'lucide-react';

const dataByLang = {
  es: {
    title: '¿Por qué elegir LinkRip?',
    subtitle: 'La forma más simple y efectiva de descargar contenido',
    items: [
      { icon: Zap, title: 'Súper rápido', description: 'Descarga en segundos, sin esperas innecesarias.' },
      { icon: Palette, title: 'Interfaz limpia', description: 'Diseño moderno y claro para cada plataforma.' },
      { icon: Grid3x3, title: 'Múltiples formatos', description: 'Video con varias calidades y audio MP3 optimizado.' },
      { icon: Shield, title: 'Descargas seguras', description: 'Tu privacidad y seguridad son prioridad.' },
      { icon: Smartphone, title: 'Optimizado móvil', description: 'Funciona en desktop y celular sin fricción.' },
      { icon: FileCheck, title: 'Sin registro', description: 'No necesitas cuenta. Pega el link y descarga.' },
    ],
  },
  en: {
    title: 'Why choose LinkRip?',
    subtitle: 'The simplest and most effective way to download content',
    items: [
      { icon: Zap, title: 'Super fast', description: 'Download in seconds with no unnecessary waiting.' },
      { icon: Palette, title: 'Clean interface', description: 'Modern and clear design across platforms.' },
      { icon: Grid3x3, title: 'Multiple formats', description: 'Video at different qualities and optimized MP3 audio.' },
      { icon: Shield, title: 'Secure downloads', description: 'Your privacy and security come first.' },
      { icon: Smartphone, title: 'Mobile optimized', description: 'Works smoothly on desktop and mobile.' },
      { icon: FileCheck, title: 'No signup', description: 'No account needed. Paste the link and download.' },
    ],
  },
};

const Benefits = ({ language }) => {
  const t = dataByLang[language];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">{t.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.items.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="glass-effect border-border/50 p-6 hover:scale-105 smooth-transition group"
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 smooth-transition">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
