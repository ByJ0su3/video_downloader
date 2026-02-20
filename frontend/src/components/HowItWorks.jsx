import React from 'react';
import { Card } from './ui/card';
import { Link2, MousePointerClick, Download } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    title: 'Pega el link',
    description: 'Copia y pega el enlace del video desde cualquier plataforma soportada.',
  },
  {
    icon: MousePointerClick,
    title: 'Elige MP3 o Video',
    description: 'Selecciona si quieres descargar el video completo o solo el audio en MP3.',
  },
  {
    icon: Download,
    title: 'Descarga',
    description: 'Haz clic en descargar y obtén tu archivo en segundos, listo para usar.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">
            Cómo funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tres pasos simples para descargar tus videos favoritos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index}
                className="glass-effect border-border/50 p-8 text-center hover:scale-105 smooth-transition group"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl platform-gradient platform-glow flex items-center justify-center group-hover:scale-110 smooth-transition">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="mb-2 text-sm font-semibold text-muted-foreground">
                  Paso {index + 1}
                </div>
                <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
