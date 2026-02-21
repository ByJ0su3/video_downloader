import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Link2, Sparkles, Music, Video, ClipboardPaste, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://videodownloader-production-8194.up.railway.app/api';

const platformPatterns = [
  { id: 'youtube', pattern: /youtube\.com|youtu\.be/i },
  { id: 'twitter', pattern: /twitter\.com|x\.com/i },
  { id: 'instagram', pattern: /instagram\.com/i },
  { id: 'twitch', pattern: /twitch\.tv/i },
  { id: 'tiktok', pattern: /tiktok\.com/i },
];

const textByLang = {
  es: {
    badge: 'Rapido, seguro y sin limites',
    subtitle: 'Pega un link de YouTube, Twitter, Instagram, Twitch o TikTok y descarga en segundos.',
    inputPlaceholder: 'Pega aqui tu enlace...',
    format: 'Formato',
    video: 'Video',
    image: 'Imagen',
    mp3: 'Audio MP3',
    audioQuality: 'Calidad de audio',
    videoQuality: 'Calidad de video',
    videoFps: 'FPS',
    max: 'Maximo',
    best: 'Mejor disponible',
    sourceFps: 'FPS original',
    processing: 'Procesando...',
    processingQueued: 'En cola...',
    processingPreparing: 'Preparando descarga...',
    processingDownloading: 'Descargando en servidor...',
    processingFinalizing: 'Finalizando archivo...',
    download: 'Descargar',
    note: 'Respetamos los limites de cada fuente. La calidad depende del audio/video original.',
    urlRequired: 'Por favor, ingresa un enlace',
    pasteOk: 'Enlace pegado desde portapapeles',
    pasteError: 'No se pudo leer el portapapeles',
    ready: 'Listo para descargar',
    downloadStarted: 'Descarga iniciada',
    downloadError: 'No se pudo completar la descarga',
    videoSummary: (quality, fps) => `Video: ${quality}, ${fps}`,
    audioSummary: (quality) => `Audio: ${quality}`,
    imageSummary: 'Imagen original',
    titles: {
      auto: { lead: 'Descarga videos o convierte a', accent: 'MP3 en maxima calidad' },
      youtube: { lead: 'Descarga videos o convierte a MP3 en', accent: 'YouTube' },
      twitter: { lead: 'Descarga videos en', accent: 'Twitter/X' },
      instagram: { lead: 'Descarga videos o imagenes en', accent: 'Instagram' },
      twitch: { lead: 'Descarga videos en', accent: 'Twitch' },
      tiktok: { lead: 'Descarga videos en', accent: 'TikTok' },
    },
  },
  en: {
    badge: 'Fast, safe and unlimited',
    subtitle: 'Paste a YouTube, Twitter, Instagram, Twitch or TikTok link and download in seconds.',
    inputPlaceholder: 'Paste your link here...',
    format: 'Format',
    video: 'Video',
    image: 'Image',
    mp3: 'MP3 Audio',
    audioQuality: 'Audio quality',
    videoQuality: 'Video quality',
    videoFps: 'FPS',
    max: 'Maximum',
    best: 'Best available',
    sourceFps: 'Source FPS',
    processing: 'Processing...',
    processingQueued: 'Queued...',
    processingPreparing: 'Preparing download...',
    processingDownloading: 'Downloading on server...',
    processingFinalizing: 'Finalizing file...',
    download: 'Download',
    note: 'Quality depends on the original source audio/video.',
    urlRequired: 'Please enter a link',
    pasteOk: 'Link pasted from clipboard',
    pasteError: 'Clipboard access failed',
    ready: 'Ready to download',
    downloadStarted: 'Download started',
    downloadError: 'Download failed',
    videoSummary: (quality, fps) => `Video: ${quality}, ${fps}`,
    audioSummary: (quality) => `Audio: ${quality}`,
    imageSummary: 'Original image',
    titles: {
      auto: { lead: 'Download videos or convert to', accent: 'MP3 in highest quality' },
      youtube: { lead: 'Download videos or convert to MP3 on', accent: 'YouTube' },
      twitter: { lead: 'Download videos on', accent: 'Twitter/X' },
      instagram: { lead: 'Download videos or images on', accent: 'Instagram' },
      twitch: { lead: 'Download videos on', accent: 'Twitch' },
      tiktok: { lead: 'Download videos on', accent: 'TikTok' },
    },
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
  const [processingLabel, setProcessingLabel] = useState('');

  const t = textByLang[language];

  const detectPlatform = (urlString) => {
    const match = platformPatterns.find((platform) => platform.pattern.test(String(urlString || '')));
    return match ? match.id : null;
  };

  const imageFormatEnabled = selectedPlatform === 'instagram' || (selectedPlatform === 'auto' && detectPlatform(url) === 'instagram');

  const heroTitle = useMemo(() => {
    return t.titles[selectedPlatform] || t.titles.auto;
  }, [selectedPlatform, t.titles]);

  useEffect(() => {
    if (format === 'image' && !imageFormatEnabled) {
      setFormat('video');
    }
  }, [format, imageFormatEnabled]);

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if (!newUrl.trim()) return;

    if (selectedPlatform === 'auto') {
      const detected = detectPlatform(newUrl);
      if (detected) setSelectedPlatform(detected);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) return;

      setUrl(clipboardText);
      if (selectedPlatform === 'auto') {
        const detected = detectPlatform(clipboardText);
        if (detected) setSelectedPlatform(detected);
      }
      toast.success(t.pasteOk);
    } catch {
      toast.error(t.pasteError);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      toast.error(t.urlRequired);
      return;
    }

    setIsProcessing(true);
    setProcessingLabel(t.processingQueued);

    try {
      const createJobResponse = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          format,
          audio_quality: audioQuality,
          video_quality: videoQuality,
          video_fps: videoFps,
          platform: selectedPlatform,
        }),
      });

      if (!createJobResponse.ok) {
        let detail = t.downloadError;
        try {
          const errorData = await createJobResponse.json();
          if (errorData?.detail) detail = errorData.detail;
        } catch {
          // no-op
        }
        throw new Error(detail);
      }

      const createdJob = await createJobResponse.json();
      const jobId = createdJob?.job_id;
      if (!jobId) throw new Error(t.downloadError);

      const stageLabelById = {
        queued: t.processingQueued,
        starting: t.processingPreparing,
        preparing: t.processingPreparing,
        downloading: t.processingDownloading,
        finalizing: t.processingFinalizing,
        ready: t.ready,
      };

      let jobDone = false;
      while (!jobDone) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        const statusResponse = await fetch(`${API_BASE_URL}/download/${jobId}/status`);
        if (!statusResponse.ok) throw new Error(t.downloadError);
        const statusData = await statusResponse.json();
        setProcessingLabel(stageLabelById[statusData.stage] || t.processing);

        if (statusData.status === 'error') throw new Error(statusData.error || t.downloadError);
        if (statusData.status === 'done') jobDone = true;
      }

      const downloadUrl = `${API_BASE_URL}/download/${jobId}/file`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();

      const summary =
        format === 'mp3'
          ? t.audioSummary(audioQuality === 'max' ? t.max : `${audioQuality} kbps`)
          : format === 'image'
            ? t.imageSummary
            : t.videoSummary(
                videoQuality === 'best' ? t.best : videoQuality,
                videoFps === 'source' ? t.sourceFps : `${videoFps} FPS`,
              );

      toast.success(t.downloadStarted, { description: summary });
    } catch (error) {
      toast.error(error?.message || t.downloadError);
    } finally {
      setIsProcessing(false);
      setProcessingLabel('');
    }
  };

  return (
    <section id="hero" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 platform-gradient opacity-10 smooth-transition" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 platform-gradient platform-glow border-0 px-4 py-1 text-[hsl(var(--on-platform))]">
            <Sparkles className="w-3 h-3 mr-1 text-[hsl(var(--on-platform))]" />
            <span className="text-[hsl(var(--on-platform))]">{t.badge}</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Space_Grotesk'] mb-6 leading-tight">
            {heroTitle.lead} <span className="text-gradient">{heroTitle.accent}</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">{t.subtitle}</p>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground fast-transition"
                aria-label="Paste"
              >
                <ClipboardPaste className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block text-foreground">{t.format}</label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={format === 'video' ? 'default' : 'outline'}
                onClick={() => setFormat('video')}
                className={
                  format === 'video'
                    ? 'h-auto py-4 platform-gradient platform-glow border-0 text-[hsl(var(--on-platform))]'
                    : 'h-auto py-4'
                }
              >
                <Video className="w-5 h-5 mr-2" />
                {t.video}
              </Button>
              <Button
                variant={format === 'image' ? 'default' : 'outline'}
                onClick={() => setFormat('image')}
                disabled={!imageFormatEnabled}
                className={
                  format === 'image'
                    ? 'h-auto py-4 platform-gradient platform-glow border-0 text-[hsl(var(--on-platform))]'
                    : 'h-auto py-4'
                }
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                {t.image}
              </Button>
              <Button
                variant={format === 'mp3' ? 'default' : 'outline'}
                onClick={() => setFormat('mp3')}
                className={
                  format === 'mp3'
                    ? 'h-auto py-4 platform-gradient platform-glow border-0 text-[hsl(var(--on-platform))]'
                    : 'h-auto py-4'
                }
              >
                <Music className="w-5 h-5 mr-2" />
                {t.mp3}
              </Button>
            </div>
          </div>

          {format === 'mp3' && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block text-foreground">{t.audioQuality}</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['128', '192', '256', '320', 'max'].map((q) => (
                  <Button
                    key={q}
                    variant={audioQuality === q ? 'default' : 'outline'}
                    onClick={() => setAudioQuality(q)}
                    className={audioQuality === q ? 'platform-gradient border-0 text-[hsl(var(--on-platform))]' : ''}
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
                <label className="text-sm font-medium mb-3 block text-foreground">{t.videoQuality}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {videoQualities.map((q) => (
                    <Button
                      key={q}
                      variant={videoQuality === q ? 'default' : 'outline'}
                      onClick={() => setVideoQuality(q)}
                      className={videoQuality === q ? 'platform-gradient border-0 text-[hsl(var(--on-platform))]' : ''}
                      size="sm"
                    >
                      {q === 'best' ? t.best : q}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">{t.videoFps}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {videoFpsOptions.map((fps) => (
                    <Button
                      key={fps}
                      variant={videoFps === fps ? 'default' : 'outline'}
                      onClick={() => setVideoFps(fps)}
                      className={videoFps === fps ? 'platform-gradient border-0 text-[hsl(var(--on-platform))]' : ''}
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
            className="w-full h-14 text-base font-semibold platform-gradient platform-glow border-0 text-[hsl(var(--on-platform))]"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-[hsl(var(--on-platform)/0.35)] border-t-[hsl(var(--on-platform))] rounded-full animate-spin mr-2" />
                {processingLabel || t.processing}
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                {t.download}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">{t.note}</p>
        </Card>
      </div>
    </section>
  );
};

export default Hero;
