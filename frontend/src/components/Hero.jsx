import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Link2, Sparkles, Music, Video } from 'lucide-react';
import { toast } from 'sonner';
import { FaYoutube, FaTwitter, FaInstagram, FaTwitch, FaTiktok } from 'react-icons/fa';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, pattern: /youtube\.com|youtu\.be/i },
  { id: 'twitter', name: 'Twitter/X', icon: FaTwitter, pattern: /twitter\.com|x\.com/i },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, pattern: /instagram\.com/i },
  { id: 'twitch', name: 'Twitch', icon: FaTwitch, pattern: /twitch\.tv/i },
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, pattern: /tiktok\.com/i },
];

const Hero = ({ selectedPlatform, setSelectedPlatform }) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('video');
  const [quality, setQuality] = useState('max');
  const [isProcessing, setIsProcessing] = useState(false);

  const detectPlatform = (urlString) => {
    for (const platform of platforms) {
      if (platform.pattern.test(urlString)) {
        return platform.id;
      }
    }
    return null;
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    if (newUrl.trim()) {
      const detected = detectPlatform(newUrl);
      if (detected) {
        setSelectedPlatform(detected);
        toast.success(`Plataforma detectada: ${platforms.find(p => p.id === detected)?.name}`);
      }
    }
  };

  const handleDownload = () => {
    if (!url.trim()) {
      toast.error('Por favor ingresa un enlace');
      return;
    }

    if (selectedPlatform === 'auto') {
      toast.error('No pudimos detectar la plataforma. Selecciónala manualmente.');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      toast.success(`${format === 'mp3' ? 'Audio' : 'Video'} listo para descargar!`, {
        description: format === 'mp3' ? `Calidad: ${quality === 'max' ? 'Máxima disponible' : quality}` : 'Calidad original'
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <section id="hero" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 platform-gradient opacity-10 smooth-transition" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 platform-gradient platform-glow border-0 px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Rápido, seguro y sin límites
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Space_Grotesk'] mb-6 leading-tight">
            Descarga videos o convierte a <span className="text-gradient">MP3 en máxima calidad</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Pega un link de YouTube, Twitter, Instagram, Twitch o TikTok y descarga en segundos.
          </p>
        </div>

        {/* Main Download Card */}
        <Card className="glass-effect platform-glow border-border/50 p-6 sm:p-8 max-w-4xl mx-auto">
          {/* URL Input */}
          <div className="mb-6">
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pega aquí tu enlace de video (ej: https://youtube.com/watch?v=...)" 
                value={url}
                onChange={handleUrlChange}
                className="pl-12 h-14 text-base bg-secondary/50 border-border/50 focus:border-[hsl(var(--platform-primary))] smooth-transition"
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">Plataforma</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <Button
                variant={selectedPlatform === 'auto' ? 'default' : 'outline'}
                onClick={() => setSelectedPlatform('auto')}
                className="h-auto py-3 flex flex-col items-center gap-1"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">Auto</span>
              </Button>
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Button
                    key={platform.id}
                    variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`h-auto py-3 flex flex-col items-center gap-1 ${
                      selectedPlatform === platform.id ? 'platform-gradient platform-glow border-0 text-white' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{platform.name.split('/')[0]}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">Formato</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={format === 'video' ? 'default' : 'outline'}
                onClick={() => setFormat('video')}
                className={`h-auto py-4 ${
                  format === 'video' ? 'platform-gradient platform-glow border-0 text-white' : ''
                }`}
              >
                <Video className="w-5 h-5 mr-2" />
                Video
              </Button>
              <Button
                variant={format === 'mp3' ? 'default' : 'outline'}
                onClick={() => setFormat('mp3')}
                className={`h-auto py-4 ${
                  format === 'mp3' ? 'platform-gradient platform-glow border-0 text-white' : ''
                }`}
              >
                <Music className="w-5 h-5 mr-2" />
                MP3 Audio
              </Button>
            </div>
          </div>

          {/* Quality Selection (only for MP3) */}
          {format === 'mp3' && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block">Calidad de Audio</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['128', '192', '256', '320', 'max'].map((q) => (
                  <Button
                    key={q}
                    variant={quality === q ? 'default' : 'outline'}
                    onClick={() => setQuality(q)}
                    className={quality === q ? 'platform-gradient border-0 text-white' : ''}
                    size="sm"
                  >
                    {q === 'max' ? 'Máximo' : `${q} kbps`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Download Button */}
          <Button 
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full h-14 text-base font-semibold platform-gradient platform-glow border-0"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Descargar {format === 'mp3' ? 'MP3' : 'Video'}
              </>
            )}
          </Button>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Respetamos los límites de cada fuente. La calidad depende del audio/video original.
          </p>
        </Card>
      </div>
    </section>
  );
};

export default Hero;
