import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Link2, Sparkles, Music, Video, ClipboardPaste, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://videodownloader-production-8194.up.railway.app/api';
const ENABLE_BROWSER_COOKIES = String(process.env.REACT_APP_ENABLE_BROWSER_COOKIES || 'false').toLowerCase() === 'true';

const platformPatterns = [
  { id: 'youtube', pattern: /youtube\.com|youtu\.be/i },
  { id: 'twitter', pattern: /twitter\.com|x\.com/i },
  { id: 'instagram', pattern: /instagram\.com/i },
  { id: 'twitch', pattern: /twitch\.tv/i },
  { id: 'tiktok', pattern: /tiktok\.com/i },
];

const textByLang = {
  es: {
    badge: 'Rapido, seguro y con control de cookies',
    subtitle: 'Descarga contenido publico o usa cookies.txt cuando la plataforma pida login.',
    inputPlaceholder: 'Pega aqui tu enlace...',
    format: 'Formato',
    video: 'Video',
    audio: 'Audio MP3',
    cookiesTitle: 'Autenticacion',
    cookiesNone: 'Publico (sin cookies)',
    cookiesUpload: 'Subir cookies.txt',
    cookiesBrowser: 'cookies-from-browser (local)',
    cookiesFile: 'Archivo cookies.txt (Netscape)',
    cookiesHint: 'No subas cookies de cuentas sensibles.',
    cookiesHelpTitle: 'Como preparar cookies.txt',
    cookiesHelp1: 'Instala una extension confiable para exportar cookies en formato Netscape.',
    cookiesHelp2: 'Inicia sesion solo en la plataforma objetivo (YouTube, Instagram, etc.).',
    cookiesHelp3: 'Exporta cookies del dominio necesario y guarda el archivo como cookies.txt.',
    cookiesHelp4: 'Sube el archivo aqui solo cuando el contenido requiera login.',
    cookiesHelpWarn: 'No uses cookies de cuentas personales sensibles o con informacion financiera.',
    viewInstructions: 'Ver instrucciones',
    hideInstructions: 'Ocultar instrucciones',
    playlist: 'Permitir playlist',
    processing: 'Procesando...',
    progress: (v) => `${v}% completado`,
    download: 'Descargar',
    note: 'No descargamos contenido privado o protegido por DRM. Si requiere login, usa cookies.txt.',
    urlRequired: 'Por favor, ingresa un enlace',
    cookieFileRequired: 'Debes subir cookies.txt para modo upload',
    pasteOk: 'Enlace pegado desde portapapeles',
    pasteError: 'No se pudo leer el portapapeles',
    downloadStarted: 'Descarga iniciada',
    downloadError: 'No se pudo completar la descarga',
  },
  en: {
    badge: 'Fast, safe and cookie-aware',
    subtitle: 'Download public content or upload cookies.txt when login is required.',
    inputPlaceholder: 'Paste your link here...',
    format: 'Format',
    video: 'Video',
    audio: 'MP3 Audio',
    cookiesTitle: 'Authentication',
    cookiesNone: 'Public (no cookies)',
    cookiesUpload: 'Upload cookies.txt',
    cookiesBrowser: 'cookies-from-browser (local)',
    cookiesFile: 'cookies.txt file (Netscape)',
    cookiesHint: 'Never upload cookies from sensitive accounts.',
    cookiesHelpTitle: 'How to prepare cookies.txt',
    cookiesHelp1: 'Install a trusted extension that exports cookies in Netscape format.',
    cookiesHelp2: 'Sign in only to the target platform (YouTube, Instagram, etc.).',
    cookiesHelp3: 'Export cookies for the needed domain and save as cookies.txt.',
    cookiesHelp4: 'Upload it here only when the content requires login.',
    cookiesHelpWarn: 'Do not use cookies from sensitive personal or financial accounts.',
    viewInstructions: 'View instructions',
    hideInstructions: 'Hide instructions',
    playlist: 'Allow playlist',
    processing: 'Processing...',
    progress: (v) => `${v}% completed`,
    download: 'Download',
    note: 'Private/DRM protected content is not supported. Use cookies.txt when login is required.',
    urlRequired: 'Please enter a link',
    cookieFileRequired: 'You must upload cookies.txt for upload mode',
    pasteOk: 'Link pasted from clipboard',
    pasteError: 'Clipboard access failed',
    downloadStarted: 'Download started',
    downloadError: 'Download failed',
  },
};

const Hero = ({ selectedPlatform, setSelectedPlatform, language }) => {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('video');
  const [cookiesMode, setCookiesMode] = useState('none');
  const [cookiesFile, setCookiesFile] = useState(null);
  const [playlist, setPlaylist] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [showCookieHelp, setShowCookieHelp] = useState(false);

  const t = textByLang[language];

  const detectPlatform = (urlString) => {
    const match = platformPatterns.find((platform) => platform.pattern.test(String(urlString || '')));
    return match ? match.id : null;
  };

  const titleByPlatform = useMemo(() => {
    const map = {
      auto: language === 'es' ? 'Descarga video o MP3' : 'Download video or MP3',
      youtube: 'YouTube',
      twitter: 'Twitter/X',
      instagram: 'Instagram',
      twitch: 'Twitch',
      tiktok: 'TikTok',
    };
    return map[selectedPlatform] || map.auto;
  }, [language, selectedPlatform]);

  useEffect(() => {
    if (cookiesMode !== 'upload') {
      setCookiesFile(null);
    }
  }, [cookiesMode]);

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

  const createRequest = () => {
    if (cookiesMode === 'upload') {
      const form = new FormData();
      form.append('url', url.trim());
      form.append('type', type);
      form.append('cookiesMode', cookiesMode);
      form.append('playlist', String(playlist));
      form.append('cookiesFile', cookiesFile);
      return { body: form };
    }

    return {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url.trim(),
        type,
        cookiesMode,
        playlist,
      }),
    };
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      toast.error(t.urlRequired);
      return;
    }
    if (cookiesMode === 'upload' && !cookiesFile) {
      toast.error(t.cookieFileRequired);
      return;
    }

    setIsProcessing(true);
    setProcessingLabel(t.processing);

    try {
      const request = createRequest();
      const createJobResponse = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        ...request,
      });

      const createdJob = await createJobResponse.json();
      if (!createJobResponse.ok) {
        throw new Error(createdJob?.error || t.downloadError);
      }

      const jobId = createdJob?.id;
      if (!jobId) throw new Error(t.downloadError);

      let finalStatus = createdJob;
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        const statusResponse = await fetch(`${API_BASE_URL}/download/${jobId}/status`);
        const statusData = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(statusData?.error || t.downloadError);

        finalStatus = statusData;
        if (statusData?.progress != null) {
          setProcessingLabel(t.progress(statusData.progress));
        } else {
          setProcessingLabel(t.processing);
        }

        if (statusData.status === 'error') {
          throw new Error(statusData?.error || t.downloadError);
        }
        if (statusData.status === 'done') break;
      }

      const downloadPath = finalStatus?.downloadUrl || `/api/download/${jobId}/file`;
      const absoluteUrl = downloadPath.startsWith('http') ? downloadPath : `${API_BASE_URL}${downloadPath.replace('/api', '')}`;
      const link = document.createElement('a');
      link.href = absoluteUrl;
      link.setAttribute('download', finalStatus?.fileName || '');
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(t.downloadStarted);
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
            {language === 'es' ? 'Descarga en segundos desde' : 'Download in seconds from'}{' '}
            <span className="text-gradient">{titleByPlatform}</span>
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={type === 'video' ? 'default' : 'outline'}
                onClick={() => setType('video')}
                className={type === 'video' ? 'h-auto py-4 platform-gradient border-0 text-[hsl(var(--on-platform))]' : 'h-auto py-4'}
              >
                <Video className="w-5 h-5 mr-2" />
                {t.video}
              </Button>
              <Button
                variant={type === 'audio' ? 'default' : 'outline'}
                onClick={() => setType('audio')}
                className={type === 'audio' ? 'h-auto py-4 platform-gradient border-0 text-[hsl(var(--on-platform))]' : 'h-auto py-4'}
              >
                <Music className="w-5 h-5 mr-2" />
                {t.audio}
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block text-foreground">{t.cookiesTitle}</label>
            <div className={`grid gap-2 ${ENABLE_BROWSER_COOKIES ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <Button
                type="button"
                variant={cookiesMode === 'none' ? 'default' : 'outline'}
                onClick={() => setCookiesMode('none')}
                className={cookiesMode === 'none' ? 'platform-gradient border-0 text-[hsl(var(--on-platform))]' : ''}
                size="sm"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                {t.cookiesNone}
              </Button>
              <Button
                type="button"
                variant={cookiesMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setCookiesMode('upload')}
                className={cookiesMode === 'upload' ? 'platform-gradient border-0 text-[hsl(var(--on-platform))]' : ''}
                size="sm"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {t.cookiesUpload}
              </Button>
              {ENABLE_BROWSER_COOKIES && (
                <Button
                  type="button"
                  variant={cookiesMode === 'browser' ? 'default' : 'outline'}
                  onClick={() => setCookiesMode('browser')}
                  className={cookiesMode === 'browser' ? 'platform-gradient border-0 text-[hsl(var(--on-platform))]' : ''}
                  size="sm"
                >
                  {t.cookiesBrowser}
                </Button>
              )}
            </div>

            {cookiesMode === 'upload' && (
              <div className="mt-3">
                <label className="text-xs font-medium mb-2 block text-muted-foreground">{t.cookiesFile}</label>
                <Input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => setCookiesFile(e.target.files?.[0] || null)}
                  className="h-11 bg-secondary/50 border-border/50"
                />
                <p className="text-xs text-muted-foreground mt-2">{t.cookiesHint}</p>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-border/50 bg-secondary/20 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{t.cookiesHelpTitle}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCookieHelp((prev) => !prev)}
                className="h-8 border-border/60 bg-background/40"
              >
                {showCookieHelp ? t.hideInstructions : t.viewInstructions}
              </Button>
            </div>
            {showCookieHelp && (
              <>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 mt-3">
                  <li>{t.cookiesHelp1}</li>
                  <li>{t.cookiesHelp2}</li>
                  <li>{t.cookiesHelp3}</li>
                  <li>{t.cookiesHelp4}</li>
                </ul>
                <p className="text-xs text-amber-400 mt-3">{t.cookiesHelpWarn}</p>
              </>
            )}
          </div>

          <div className="mb-6 flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 px-4 py-3">
            <span className="text-sm text-foreground">{t.playlist}</span>
            <Button
              type="button"
              variant={playlist ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlaylist((prev) => !prev)}
              className={playlist ? 'platform-gradient border-0 text-[hsl(var(--on-platform))]' : ''}
            >
              {playlist ? 'ON' : 'OFF'}
            </Button>
          </div>

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
