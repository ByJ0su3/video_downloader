import React from 'react';
import { Card } from './ui/card';
import { FaYoutube, FaTwitter, FaInstagram, FaTwitch, FaTiktok } from 'react-icons/fa';
import { CheckCircle2 } from 'lucide-react';

const platformsData = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: FaYoutube,
    description: 'Videos, shorts y más',
    features: ['Videos completos', 'Shorts', 'Calidad hasta 4K'],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: FaTwitter,
    description: 'Tweets con video',
    features: ['Videos de tweets', 'Videos de respuestas', 'GIFs animados'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: FaInstagram,
    description: 'Reels, stories y posts',
    features: ['Reels', 'Stories', 'Posts de video'],
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: FaTwitch,
    description: 'Clips y VODs',
    features: ['Clips', 'VODs', 'Highlights'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: FaTiktok,
    description: 'Videos sin marca de agua',
    features: ['Videos completos', 'Sin watermark', 'Calidad original'],
  },
];

const Platforms = ({ setSelectedPlatform }) => {
  return (
    <section id="platforms" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">
            Plataformas soportadas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descarga contenido de las plataformas más populares
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformsData.map((platform) => {
            const Icon = platform.icon;
            return (
              <Card
                key={platform.id}
                onClick={() => {
                  setSelectedPlatform(platform.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="glass-effect border-border/50 p-6 hover:scale-105 smooth-transition cursor-pointer group"
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-xl platform-gradient platform-glow flex items-center justify-center group-hover:scale-110 smooth-transition flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold font-['Space_Grotesk'] mb-1">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {platform.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-[hsl(var(--platform-primary))] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Platforms;
