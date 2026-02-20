import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const faqs = [
  {
    question: '¿Funciona con reels y stories de Instagram?',
    answer: 'Sí, puedes descargar reels, stories y posts de video de Instagram. Solo necesitas el enlace del contenido.',
  },
  {
    question: '¿Qué significa "máximo kbps"?',
    answer: 'Kbps (kilobits por segundo) mide la calidad del audio. Más kbps = mejor calidad. "Máximo" significa que extraemos el audio en la mejor calidad disponible de la fuente original.',
  },
  {
    question: '¿Por qué a veces no sale 320 kbps?',
    answer: 'La calidad máxima depende del audio original del video. Si la fuente solo tiene audio en 128 kbps, no podemos mejorar esa calidad. Extraemos lo mejor disponible, pero no inventamos calidad que no existe.',
  },
  {
    question: '¿Se guarda mi link o información?',
    answer: 'No. No guardamos enlaces, no rastreamos tu actividad y no requieres registro. Todo el procesamiento es temporal y se elimina inmediatamente después.',
  },
  {
    question: '¿Qué plataformas soporta?',
    answer: 'Actualmente soportamos YouTube, Twitter/X, Instagram (videos, reels, stories), Twitch (clips y VODs) y TikTok. Estamos trabajando en agregar más plataformas.',
  },
  {
    question: '¿Por qué algunos links no funcionan?',
    answer: 'Algunos videos pueden estar protegidos, ser privados, estar geo-bloqueados o tener restricciones de copyright. También verificamos que el enlace sea válido y de una plataforma soportada.',
  },
  {
    question: '¿Es legal descargar videos?',
    answer: 'Esta herramienta es solo para contenido que tengas derecho a descargar. Debes respetar los derechos de autor y términos de servicio de cada plataforma. Usa solo para contenido propio o con permiso.',
  },
  {
    question: '¿Tiene límites de descarga?',
    answer: 'Por ahora no hay límites estrictos, pero pedimos usar el servicio de forma razonable. Si detectamos uso abusivo, podríamos implementar límites para mantener el servicio rápido para todos.',
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Todo lo que necesitas saber sobre LinkRip
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="glass-effect border-border/50 rounded-lg px-6 py-2"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
