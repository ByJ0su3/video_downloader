import React from 'react';
import { Card } from './ui/card';
import { Link2, MousePointerClick, Download } from 'lucide-react';

const HowItWorks = ({ language }) => {
  const copy = {
    es: {
      title: 'Cómo funciona',
      subtitle: 'Tres pasos simples para descargar tus videos favoritos',
      step: 'Paso',
      steps: [
        {
          icon: Link2,
          title: 'Pega el link',
          description: 'Copia y pega el enlace del video desde cualquier plataforma soportada.',
        },
        {
          icon: MousePointerClick,
          title: 'Elige MP3 o video',
          description: 'Selecciona si quieres descargar video completo o solo audio MP3.',
        },
        {
          icon: Download,
          title: 'Descarga',
          description: 'Haz clic en descargar y obtén tu archivo en segundos.',
        },
      ],
    },
    en: {
      title: 'How it works',
      subtitle: 'Three simple steps to download your favorite videos',
      step: 'Step',
      steps: [
        {
          icon: Link2,
          title: 'Paste the link',
          description: 'Copy and paste the video URL from any supported platform.',
        },
        {
          icon: MousePointerClick,
          title: 'Choose MP3 or video',
          description: 'Select full video download or MP3 audio conversion.',
        },
        {
          icon: Download,
          title: 'Download',
          description: 'Click download and get your file in seconds.',
        },
      ],
    },
  };

  const t = copy[language];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">{t.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="glass-effect border-border/50 p-8 text-center hover:scale-105 smooth-transition group"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl platform-gradient platform-glow flex items-center justify-center group-hover:scale-110 smooth-transition">
                  <Icon className="w-8 h-8 text-[hsl(var(--on-platform))]" />
                </div>
                <div className="mb-2 text-sm font-semibold text-muted-foreground">
                  {t.step} {index + 1}
                </div>
                <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
