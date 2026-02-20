import React from 'react';
import { Card } from './ui/card';
import { Zap, Palette, Grid3x3, Shield, Smartphone, FileCheck } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    title: 'Súper rápido',
    description: 'Descarga en segundos, sin esperas innecesarias ni anuncios molestos.',
  },
  {
    icon: Palette,
    title: 'Interfaz limpia',
    description: 'Diseño moderno y minimalista que se adapta a cada plataforma.',
  },
  {
    icon: Grid3x3,
    title: 'Múltiples formatos',
    description: 'Compatible con video en varias calidades y audio MP3 optimizado.',
  },
  {
    icon: Shield,
    title: 'Descargas seguras',
    description: 'Sin virus, sin malware. Tu privacidad y seguridad son prioridad.',
  },
  {
    icon: Smartphone,
    title: 'Optimizado móvil',
    description: 'Funciona perfectamente en cualquier dispositivo, en cualquier lugar.',
  },
  {
    icon: FileCheck,
    title: 'Sin registro',
    description: 'No necesitas crear cuenta. Pega el link y descarga, así de simple.',
  },
];

const Benefits = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">
            ¿Por qué elegir LinkRip?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            La forma más simple y efectiva de descargar contenido
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="glass-effect border-border/50 p-6 hover:scale-105 smooth-transition group"
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 smooth-transition">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
