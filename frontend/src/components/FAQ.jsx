import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const dataByLang = {
  es: {
    title: 'Preguntas frecuentes',
    subtitle: 'Todo lo que necesitas saber sobre LinkRip',
    faqs: [
      {
        question: 'Funciona con reels y stories de Instagram?',
        answer: 'Si, puedes descargar reels, stories y posts de video. Solo necesitas el enlace.',
      },
      {
        question: 'Que significa maximo kbps?',
        answer: 'Kbps mide calidad de audio. Mas kbps significa mejor audio dentro del limite de la fuente.',
      },
      {
        question: 'Por que a veces no sale 320 kbps?',
        answer: 'La calidad maxima depende del audio original del video. No se puede inventar calidad.',
      },
      {
        question: 'Se guarda mi link o informacion?',
        answer: 'No guardamos enlaces ni actividad personal. El procesamiento es temporal.',
      },
      {
        question: 'Que plataformas soporta?',
        answer: 'YouTube, Twitter/X, Instagram, Twitch y TikTok.',
      },
      {
        question: 'Por que algunos links no funcionan?',
        answer: 'Algunos videos son privados, bloqueados por region o tienen restricciones de copyright.',
      },
      {
        question: 'Es legal descargar videos?',
        answer: 'Debes respetar derechos de autor y terminos de cada plataforma.',
      },
      {
        question: 'Tiene limites de descarga?',
        answer: 'No hay limites estrictos por ahora, pero el uso debe ser razonable.',
      },
    ],
  },
  en: {
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know about LinkRip',
    faqs: [
      {
        question: 'Does it work with Instagram reels and stories?',
        answer: 'Yes, you can download reels, stories and video posts with a valid URL.',
      },
      {
        question: 'What does maximum kbps mean?',
        answer: 'Kbps measures audio quality. Higher kbps means better quality within source limits.',
      },
      {
        question: 'Why is 320 kbps not always available?',
        answer: 'Maximum quality depends on the original source audio. It cannot be artificially improved.',
      },
      {
        question: 'Do you store my link or data?',
        answer: 'No links or personal activity are stored. Processing is temporary.',
      },
      {
        question: 'Which platforms are supported?',
        answer: 'YouTube, Twitter/X, Instagram, Twitch and TikTok.',
      },
      {
        question: 'Why do some links fail?',
        answer: 'Some videos are private, geo-blocked or restricted by copyright rules.',
      },
      {
        question: 'Is downloading videos legal?',
        answer: 'You must respect copyright and platform terms for any content you download.',
      },
      {
        question: 'Are there download limits?',
        answer: 'There are no strict limits right now, but usage should remain reasonable.',
      },
    ],
  },
};

const FAQ = ({ language }) => {
  const t = dataByLang[language];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] mb-4">{t.title}</h2>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {t.faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-effect border-border/50 rounded-lg px-6 py-2"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
