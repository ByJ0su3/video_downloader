import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Link2, Sparkles, Music, Video, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { FaYoutube, FaTwitter, FaInstagram, FaTwitch, FaTiktok } from 'react-icons/fa';

const platforms = [
  { id: 'youtube', name: 'YouTube', pattern: /youtube\.com|youtu\.be/i, icon: FaYoutube },
  { id: 'twitter', name: 'Twitter/X', pattern: /twitter\.com|x\.com/i, icon: FaTwitter },
  { id: 'instagram', name: 'Instagram', pattern: /instagram\.com/i, icon: FaInstagram },
  { id: 'twitch', name: 'Twitch', pattern: /twitch\.tv/i, icon: FaTwitch },
  { id: 'tiktok', name: 'TikTok', pattern: /tiktok\.com/i, icon: FaTiktok },
];

const textByLang = {
  es: {
    badge: 'Rapido, seguro y sin limites',
    title: 'Descarga videos o convierte a',
    titleAccent: 'MP3 en maxima calidad',
    subtitle: 'Pega un link de YouTube, Twitter, Instagram, Twitch o TikTok y descarga en segundos.',
    inputPlaceholder: 'Pega aqui tu enlace de video (ej: https://youtube.com/watch?v=...)',
    platform: 'Plataforma',
    auto: 'Auto',
    format: 'Formato',
    video: 'Video',
    mp3: 'MP3 Audio',
    audioQuality: 'Calidad de audio',
    videoQuality: 'Calidad de video',
    videoFps: 'FPS',
    max: 'Maximo',
    best: 'Mejor disponible',
    sourceFps: 'FPS original',
    processing: 'Procesando...',
    download: 'Descargar',
    note: 'Respetamos los limites de cada fuente. La calidad depende del audio/video original.',
    urlRequired: 'Por favor ingresa un enlace',
    platformRequired: 'No pudimos detectar la plataforma. Seleccionala manualmente.',
    platformDetected: 'Plataforma detectada',
    pasteOk: 'Enlace pegado desde portapapeles',
    pasteError: 'No se pudo leer el portapapeles',
    ready: 'Listo para descargar',
    videoSummary: (quality, fps) => `Video: ${quality}, ${fps}`,
    audioSummary: (quality) => `Audio: ${quality}`,
  },
  en: {
    badge: 'Fast, safe and unlimited',
    title: 'Download videos or convert to',
    titleAccent: 'MP3 in highest quality',
    subtitle: 'Paste a YouTube, Twitter, Instagram, Twitch or TikTok link and download in seconds.',
    inputPlaceholder: 'Paste your video link here (ex: https://youtube.com/watch?v=...)',
    platform: 'Platform',
    auto: 'Auto',
    format: 'Format',
    video: 'Video',
    mp3: 'MP3 Audio',
    audioQuality: 'Audio quality',
    videoQuality: 'Video quality',
    videoFps: 'FPS',
    max: 'Maximum',
    best: 'Best available',
    sourceFps: 'Source FPS',
    processing: 'Processing...',
    download: 'Download',
    note: 'Quality depends on the original source audio/video.',
    urlRequired: 'Please enter a link',
    platformRequired: 'Platform was not detected. Please select it manually.',
    platformDetected: 'Platform detected',
    pasteOk: 'Link pasted from clipboard',
    pasteError: 'Clipboard access failed',
    ready: 'Ready to download',
    videoSummary: (quality, fps) => `Video: ${quality}, ${fps}`,
    audioSummary: (quality) => `Audio: ${quality}`,
  },
};

const videoQualities = ['2160p (4K)', '1440p (2K)', '1080p', '720p', '480p', 'best'];
const videoFpsOptions = ['source', '120', '60', '30'];

const Hero = ({ selectedPlatform, setSelectedPlatform, language }) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('video');
  const [audioQuality, setAudioQuality] = useState('max');
  const [videoQuality, setVideoQuality] = useState('best');
  const [videoFps, setVideoFps] = useState('source');
  const [isProcessing, setIsProcessing] = useState(false);

  const t = textByLang[language];

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

    if (!newUrl.trim()) {
      return;
    }

    const detected = detectPlatform(newUrl);
    if (detected) {
      setSelectedPlatform(detected);
      const platformName = platforms.find((p) => p.id === detected)?.name;
      toast.success(`${t.platformDetected}: ${platformName}`);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        return;
      }
      setUrl(clipboardText);
      const detected = detectPlatform(clipboardText);
      if (detected) {
        setSelectedPlatform(detected);
      }
      toast.success(t.pasteOk);
    } catch (error) {
      toast.error(t.pasteError);
    }
  };

  const handleDownload = () => {
    if (!url.trim()) {
      toast.error(t.urlRequired);
      return;
    }

    if (selectedPlatform === 'auto') {
      toast.error(t.platformRequired);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const summary =
        format === 'mp3'
          ? t.audioSummary(audioQuality === 'max' ? t.max : `${audioQuality} kbps`)
          : t.videoSummary(videoQuality === 'best' ? t.best : videoQuality, videoFps === 'source' ? t.sourceFps : `${videoFps} FPS`);

      toast.success(t.ready, { description: summary });
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <section id="hero" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 platform-gradient opacity-10 smooth-transition" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 platform-gradient platform-glow border-0 px-4 py-1 text-white">
            <Sparkles className="w-3 h-3 mr-1 text-white" />
            <span className="text-white">{t.badge}</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Space_Grotesk'] mb-6 leading-tight">
            {t.title} <span className="text-gradient">{t.titleAccent}</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t.subtitle}
          </p>
        </div>

        <Card className="glass-effect platform-glow border-border/50 p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.inputPlaceholder}
                value={url}
                onChange={handleUrlChange}
                className="pl-12 pr-12 h-14 text-base bg-secondary/50 border-border/50 focus:border-[hsl(var(--platform-primary))] smooth-transition"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white fast-transition"
                aria-label="Paste"
              >
                <ClipboardPaste className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block text-white">{t.platform}</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <Button
                variant={selectedPlatform === 'auto' ? 'default' : 'outline'}
                onClick={() => setSelectedPlatform('auto')}
                className={`h-auto py-3 flex flex-col items-center gap-1 ${
                  selectedPlatform === 'auto' ? 'platform-gradient platform-glow border-0 text-white' : ''
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">{t.auto}</span>
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

          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block text-white">{t.format}</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={format === 'video' ? 'default' : 'outline'}
                onClick={() => setFormat('video')}
                className={format === 'video' ? 'h-auto py-4 platform-gradient platform-glow border-0 text-white' : 'h-auto py-4'}
              >
                <Video className="w-5 h-5 mr-2" />
                {t.video}
              </Button>
              <Button
                variant={format === 'mp3' ? 'default' : 'outline'}
                onClick={() => setFormat('mp3')}
                className={format === 'mp3' ? 'h-auto py-4 platform-gradient platform-glow border-0 text-white' : 'h-auto py-4'}
              >
                <Music className="w-5 h-5 mr-2" />
                {t.mp3}
              </Button>
            </div>
          </div>

          {format === 'mp3' && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block text-white">{t.audioQuality}</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['128', '192', '256', '320', 'max'].map((q) => (
                  <Button
                    key={q}
                    variant={audioQuality === q ? 'default' : 'outline'}
                    onClick={() => setAudioQuality(q)}
                    className={audioQuality === q ? 'platform-gradient border-0 text-white' : ''}
                    size="sm"
                  >
                    {q === 'max' ? t.max : `${q} kbps`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {format === 'video' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block text-white">{t.videoQuality}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {videoQualities.map((q) => (
                    <Button
                      key={q}
                      variant={videoQuality === q ? 'default' : 'outline'}
                      onClick={() => setVideoQuality(q)}
                      className={videoQuality === q ? 'platform-gradient border-0 text-white' : ''}
                      size="sm"
                    >
                      {q === 'best' ? t.best : q}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block text-white">{t.videoFps}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {videoFpsOptions.map((fps) => (
                    <Button
                      key={fps}
                      variant={videoFps === fps ? 'default' : 'outline'}
                      onClick={() => setVideoFps(fps)}
                      className={videoFps === fps ? 'platform-gradient border-0 text-white' : ''}
                      size="sm"
                    >
                      {fps === 'source' ? t.sourceFps : `${fps} FPS`}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full h-14 text-base font-semibold platform-gradient platform-glow border-0 text-white"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {t.processing}
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                {t.download} {format === 'mp3' ? 'MP3' : t.video}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {t.note}
          </p>
        </Card>
      </div>
    </section>
  );
};

export default Hero;
