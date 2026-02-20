import React from 'react';
import { Download, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg platform-gradient flex items-center justify-center platform-glow">
                <Download className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-['Space_Grotesk']">LinkRip</span>
            </div>
            <p className="text-sm text-muted-foreground">
              La forma más rápida de descargar videos y convertir a MP3 desde tus plataformas favoritas.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-foreground fast-transition"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-foreground fast-transition"
                >
                  Cómo funciona
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-foreground fast-transition"
                >
                  Plataformas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-foreground fast-transition"
                >
                  Preguntas
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground fast-transition">
                  Términos de uso
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground fast-transition">
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground fast-transition">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 LinkRip. Todos los derechos reservados.
            </p>
            <p className="text-sm text-muted-foreground flex items-center">
              Solo para contenido que tengas derecho a descargar
            </p>
          </div>
          <p className="text-center mt-4 text-xs text-muted-foreground/70 flex items-center justify-center">
            Hecho con <Heart className="w-3 h-3 mx-1 text-red-500 fill-red-500" /> usando React y Tailwind
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
