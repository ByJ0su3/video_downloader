import React, { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Menu, X, Download, Sun, Moon, Sparkles } from 'lucide-react';
import { FaYoutube, FaTwitter, FaInstagram, FaTwitch, FaTiktok } from 'react-icons/fa';

const platformOptions = [
  { id: 'auto', labelEs: 'Auto', labelEn: 'Auto', icon: Sparkles },
  { id: 'youtube', labelEs: 'YouTube', labelEn: 'YouTube', icon: FaYoutube },
  { id: 'twitter', labelEs: 'Twitter/X', labelEn: 'Twitter/X', icon: FaTwitter },
  { id: 'instagram', labelEs: 'Instagram', labelEn: 'Instagram', icon: FaInstagram },
  { id: 'twitch', labelEs: 'Twitch', labelEn: 'Twitch', icon: FaTwitch },
  { id: 'tiktok', labelEs: 'TikTok', labelEn: 'TikTok', icon: FaTiktok },
];

const Navbar = ({ language, setLanguage, theme, setTheme, selectedPlatform, setSelectedPlatform }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copy = {
    es: {
      how: 'Como funciona',
      platforms: 'Plataformas',
      quality: 'Calidad MP3',
      lang: 'ES',
      theme: 'Tema',
    },
    en: {
      how: 'How it works',
      platforms: 'Platforms',
      quality: 'MP3 Quality',
      lang: 'EN',
      theme: 'Theme',
    },
  };

  const t = copy[language];
  const languageLabel = language === 'es' ? 'ES' : 'EN';
  const selectedLabel = useMemo(() => {
    const selected = platformOptions.find((platform) => platform.id === selectedPlatform);
    if (!selected) return 'Auto';
    return language === 'es' ? selected.labelEs : selected.labelEn;
  }, [language, selectedPlatform]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center min-w-0 space-x-3">
            <div className="w-9 h-9 rounded-xl platform-gradient flex items-center justify-center platform-glow shadow-md shadow-black/20">
              <Download className="w-5 h-5 text-[hsl(var(--on-platform))]" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl leading-none font-bold font-['Space_Grotesk'] text-foreground tracking-tight">LinkRip</span>
              <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full border border-border/70 text-muted-foreground">
                {selectedLabel}
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-2 py-1">
            {platformOptions.map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.id}
                  variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={
                    selectedPlatform === platform.id
                      ? 'platform-gradient platform-glow border-0 text-[hsl(var(--on-platform))] shadow-md shadow-black/25'
                      : 'text-foreground border-border/60 bg-background/50 hover:bg-accent/70'
                  }
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {language === 'es' ? platform.labelEs : platform.labelEn}
                </Button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-muted-foreground hover:text-foreground fast-transition font-medium"
            >
              {t.how}
            </button>
            <button
              onClick={() => scrollToSection('platforms')}
              className="text-sm text-muted-foreground hover:text-foreground fast-transition font-medium"
            >
              {t.platforms}
            </button>
            <button
              onClick={() => scrollToSection('mp3-quality')}
              className="text-sm text-muted-foreground hover:text-foreground fast-transition font-medium"
            >
              {t.quality}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="text-foreground border-border/70 bg-background/60 hover:bg-accent/70 min-w-[52px]"
            >
              {languageLabel}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-foreground border-border/70 bg-background/60 hover:bg-accent/70"
              aria-label={t.theme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground rounded-lg border border-border/60 bg-card/70 p-2"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {platformOptions.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Button
                    key={platform.id}
                    variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedPlatform(platform.id);
                      setMobileMenuOpen(false);
                    }}
                    className={
                      selectedPlatform === platform.id
                        ? 'platform-gradient platform-glow border-0 text-[hsl(var(--on-platform))]'
                        : 'text-foreground border-border/60 bg-background/60'
                    }
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {language === 'es' ? platform.labelEs : platform.labelEn}
                  </Button>
                );
              })}
            </div>

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground fast-transition py-2"
            >
              {t.how}
            </button>
            <button
              onClick={() => scrollToSection('platforms')}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground fast-transition py-2"
            >
              {t.platforms}
            </button>
            <button
              onClick={() => scrollToSection('mp3-quality')}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground fast-transition py-2"
            >
              {t.quality}
            </button>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                className="text-foreground border-border/70 bg-background/60"
              >
                {languageLabel}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-foreground"
                aria-label={t.theme}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
