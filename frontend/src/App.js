import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Platforms from './components/Platforms';
import MP3Quality from './components/MP3Quality';
import Benefits from './components/Benefits';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

function App() {
  const [selectedPlatform, setSelectedPlatform] = useState('auto');

  useEffect(() => {
    // Apply platform theme to body
    const body = document.body;
    if (selectedPlatform && selectedPlatform !== 'auto') {
      body.setAttribute('data-platform', selectedPlatform);
    } else {
      body.removeAttribute('data-platform');
    }
  }, [selectedPlatform]);

  return (
    <div className="min-h-screen bg-background smooth-transition">
      <Navbar />
      <Hero 
        selectedPlatform={selectedPlatform} 
        setSelectedPlatform={setSelectedPlatform} 
      />
      <HowItWorks />
      <Platforms setSelectedPlatform={setSelectedPlatform} />
      <MP3Quality />
      <Benefits />
      <FAQ />
      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
