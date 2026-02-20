import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Music, Gauge, Sparkles, Info } from 'lucide-react';

const qualityLevels = [
  { kbps: '128', quality: 'Estándar', description: 'Buena para podcasts', size: '~1MB/min' },
  { kbps: '192', quality: 'Alta', description: 'Música casual', size: '~1.4MB/min' },
  { kbps: '256', quality: 'Muy alta', description: 'Audiophile básico', size: '~2MB/min' },
  { kbps: '320', quality: 'Premium', description: 'Máxima calidad estándar', size: '~2.4MB/min' },
];

const MP3Quality = () => {
  const scrollToHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="mp3-quality" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl platform-gradient platform-glow mb-6">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">
            MP3 en máxima calidad
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Convertimos a MP3 usando la mejor calidad disponible del enlace. Si el audio original es limitado, no se puede inventar calidad.
          </p>
        </div>

        {/* Quality Explanation Card */}
        <Card className="glass-effect border-border/50 p-8 mb-8 max-w-4xl mx-auto">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-2">
                ¿Qué significa "máxima calidad disponible"?
              </h3>
              <p className="text-muted-foreground mb-4">
                Extraemos el audio en la mejor calidad que ofrece la fuente original. Por ejemplo, si un video de YouTube tiene audio en 128 kbps, ese será el máximo que podemos ofrecer. No podemos mejorar la calidad original del contenido.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-muted-foreground">
                  Por defecto, siempre intentamos obtener el máximo kbps posible
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quality Levels */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {qualityLevels.map((level, index) => (
            <Card 
              key={index}
              className="glass-effect border-border/50 p-6 text-center hover:scale-105 smooth-transition"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-['Space_Grotesk'] mb-1">
                {level.kbps} kbps
              </div>
              <div className="text-sm font-semibold text-[hsl(var(--platform-primary))] mb-2">
                {level.quality}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {level.description}
              </p>
              <div className="text-xs text-muted-foreground/70">
                {level.size}
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={scrollToHero}
            size="lg"
            className="platform-gradient platform-glow border-0 h-12 px-8"
          >
            <Music className="w-5 h-5 mr-2" />
            Convertir ahora
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MP3Quality;
