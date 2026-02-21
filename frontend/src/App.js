import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Platforms from './components/Platforms';
import MP3Quality from './components/MP3Quality';
import Footer from './components/Footer';

function App() {
  const [selectedPlatform, setSelectedPlatform] = useState('auto');
  const [language, setLanguage] = useState('es');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Apply platform theme to body
    const body = document.body;
    body.setAttribute('data-platform', selectedPlatform || 'auto');
  }, [selectedPlatform]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background smooth-transition">
      <Navbar
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
      />
      <Hero 
        selectedPlatform={selectedPlatform} 
        setSelectedPlatform={setSelectedPlatform}
        language={language}
      />
      <HowItWorks language={language} />
      <Platforms setSelectedPlatform={setSelectedPlatform} language={language} />
      <MP3Quality language={language} />
      <Footer language={language} />
      <Toaster />
    </div>
  );
}

export default App;
