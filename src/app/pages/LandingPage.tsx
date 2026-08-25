import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

// Open-source Unsplash travel images (all free to use)
const heroSlides = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&auto=format&fit=crop',
    location: 'Santorini, Greece',
    caption: 'Where the sea meets the sky',
  },
  {
    url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=80&auto=format&fit=crop',
    location: 'Taj Mahal, India',
    caption: 'A monument to wonder',
  },
  {
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=80&auto=format&fit=crop',
    location: 'Kyoto, Japan',
    caption: 'Ancient paths, timeless beauty',
  },
  {
    url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=80&auto=format&fit=crop',
    location: 'Tuscany, Italy',
    caption: 'The art of going slowly',
  },
  {
    url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&q=80&auto=format&fit=crop',
    location: 'Marrakech, Morocco',
    caption: 'A world of colour and scent',
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Tell us where you want to go',
    description:
      'Destination, budget, travel style. A few details and we have everything we need.',
  },
  {
    number: '02',
    title: 'We plan it in seconds',
    description:
      'Our AI works through thousands of routes, stays and timings to build the optimal itinerary.',
  },
  {
    number: '03',
    title: 'Refine, save, and go',
    description:
      'Adjust any detail until it feels right. Then save your plan and travel with confidence.',
  },
];

function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(new Array(heroSlides.length).fill(false));

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  const handleImageLoad = (i: number) => {
    setImagesLoaded(prev => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" ref={emblaRef}>
      <div className="flex h-full" style={{ touchAction: 'pan-y' }}>
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className="relative flex-none w-full h-full"
            style={{ minWidth: '100%' }}
          >
            {/* Skeleton while loading */}
            {!imagesLoaded[i] && (
              <div
                className="absolute inset-0"
                style={{ background: '#2A2620', animation: 'pulse 2s ease-in-out infinite' }}
              />
            )}
            <img
              src={slide.url}
              alt={slide.location}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: imagesLoaded[i] ? 1 : 0, transition: 'opacity 0.5s ease' }}
              onLoad={() => handleImageLoad(i)}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {/* Dark overlay — subtle, not full black gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(10, 8, 6, 0.62) 0%, rgba(10, 8, 6, 0.20) 60%, rgba(10, 8, 6, 0.10) 100%)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Hero text — overlaid */}
      <div className="absolute inset-0 flex flex-col justify-center pointer-events-none" style={{ paddingLeft: 'clamp(2rem, 8vw, 8rem)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            {/* Location tag */}
            <p
              className="text-sm font-medium tracking-widest uppercase mb-4"
              style={{ color: 'rgba(247, 244, 239, 0.65)', letterSpacing: '0.14em' }}
            >
              {heroSlides[currentIndex].location}
            </p>

            {/* Big editorial headline */}
            <h1
              className="font-serif text-white leading-none mb-3"
              style={{
                fontSize: 'clamp(2.75rem, 6vw, 5.5rem)',
                fontWeight: 600,
                fontFamily: 'var(--font-serif)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              Plan smarter.<br />
              <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
                Travel better.
              </span>
            </h1>

            <p
              className="mb-8 text-base font-normal"
              style={{ color: 'rgba(247, 244, 239, 0.72)', maxWidth: 380, lineHeight: 1.6 }}
            >
              {heroSlides[currentIndex].caption}
            </p>

            {/* CTA */}
            <div className="flex gap-3 pointer-events-auto flex-wrap">
              <Link
                to="/plan-trip"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200"
                style={{
                  background: '#F7F4EF',
                  color: '#1A1814',
                  borderRadius: '0.25rem',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#F7F4EF'}
              >
                Start planning
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200"
                style={{
                  color: 'rgba(247, 244, 239, 0.85)',
                  border: '1px solid rgba(247, 244, 239, 0.25)',
                  borderRadius: '0.25rem',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = '#F7F4EF';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247, 244, 239, 0.50)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(247, 244, 239, 0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(247, 244, 239, 0.85)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247, 244, 239, 0.25)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                How it works
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 flex gap-1.5" style={{ transform: 'translateX(-50%)' }}>
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all duration-300"
            style={{
              width: i === currentIndex ? 24 : 6,
              height: 6,
              borderRadius: 3,
              background: i === currentIndex ? '#F7F4EF' : 'rgba(247, 244, 239, 0.35)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Slide counter — top right */}
      <div
        className="absolute top-24 right-8 text-sm font-medium tabular-nums hidden md:block"
        style={{ color: 'rgba(247, 244, 239, 0.45)', letterSpacing: '0.05em' }}
      >
        {String(currentIndex + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: '#F7F4EF', minHeight: '100vh' }}>
      {/* Floating nav */}
      <Navigation />

      {/* Hero — full bleed carousel, no padding, no margin */}
      <HeroCarousel />

      {/* ── How it works ───────────────────────────────────── */}
      <section style={{ padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Section label */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold tracking-widest uppercase mb-10"
            style={{ color: '#C85F3C', letterSpacing: '0.16em' }}
          >
            Process
          </motion.p>

          {/* Steps — editorial numbered list */}
          <div>
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3rem 1fr',
                  gap: '2rem',
                  padding: '2rem 0',
                  borderBottom: i < processSteps.length - 1
                    ? '1px solid rgba(26, 24, 20, 0.10)'
                    : 'none',
                  alignItems: 'start',
                }}
              >
                {/* Number */}
                <p
                  className="font-serif font-normal tabular-nums leading-none pt-1"
                  style={{
                    fontSize: '1.125rem',
                    color: '#9A958F',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  {step.number}
                </p>

                {/* Content */}
                <div>
                  <h3
                    className="font-serif mb-2"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
                      fontWeight: 500,
                      color: '#1A1814',
                      lineHeight: 1.25,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-base font-normal leading-relaxed"
                    style={{ color: '#6B6560', maxWidth: 480 }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial image break ───────────────────────────── */}
      <section style={{ position: 'relative', height: 'clamp(320px, 45vw, 560px)', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80&auto=format&fit=crop"
          alt="Planning a journey"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay with editorial quote */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(10, 8, 6, 0.42)' }}
        >
          <motion.blockquote
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
            style={{ maxWidth: 640 }}
          >
            <p
              className="font-serif text-white italic"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)',
                fontWeight: 400,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}
            >
              "Not all those who wander are lost. But some of them could use a better plan."
            </p>
            <p
              className="mt-4 text-sm font-medium tracking-widest uppercase"
              style={{ color: 'rgba(247, 244, 239, 0.55)', letterSpacing: '0.12em' }}
            >
              TripSmart
            </p>
          </motion.blockquote>
        </div>
      </section>

      {/* ── Destination editorial grid ─────────────────────── */}
      <section style={{ padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 flex items-end justify-between gap-4"
          >
            <div>
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: '#C85F3C', letterSpacing: '0.16em' }}
              >
                Destinations
              </p>
              <h2
                className="font-serif"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                  fontWeight: 500,
                  color: '#1A1814',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                }}
              >
                Popular journeys<br />
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
                  planned on TripSmart
                </span>
              </h2>
            </div>
            <Link
              to="/plan-trip"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              style={{
                color: '#1A1814',
                borderBottom: '1px solid rgba(26, 24, 20, 0.30)',
                paddingBottom: 2,
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#C85F3C';
                (e.currentTarget as HTMLElement).style.borderColor = '#C85F3C';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#1A1814';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26, 24, 20, 0.30)';
              }}
            >
              Plan your own
            </Link>
          </motion.div>

          {/* 2-column asymmetric layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: 'auto auto',
              gap: '1rem',
            }}
          >
            {[
              {
                img: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=900&q=80&auto=format&fit=crop',
                location: 'Amalfi Coast',
                country: 'Italy',
                duration: '7 days from Delhi',
                tall: true,
              },
              {
                img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80&auto=format&fit=crop',
                location: 'Bali',
                country: 'Indonesia',
                duration: '10 days from Mumbai',
                tall: false,
              },
              {
                img: 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=900&q=80&auto=format&fit=crop',
                location: 'Swiss Alps',
                country: 'Switzerland',
                duration: '8 days from Bangalore',
                tall: false,
              },
            ].map((dest, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  gridRow: i === 0 ? 'span 2' : 'span 1',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '0.25rem',
                  aspectRatio: i === 0 ? undefined : '4/3',
                  height: i === 0 ? '100%' : undefined,
                  minHeight: i === 0 ? 400 : undefined,
                  cursor: 'pointer',
                }}
                className="group"
                onClick={() => window.location.href = '/plan-trip'}
              >
                <img
                  src={dest.img}
                  alt={dest.location}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                  style={{ transform: 'scale(1.02)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.02)'}
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(10, 8, 6, 0.70) 0%, rgba(10, 8, 6, 0.10) 60%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p
                    className="text-xs font-medium tracking-widest uppercase mb-1"
                    style={{ color: 'rgba(247, 244, 239, 0.55)', letterSpacing: '0.12em' }}
                  >
                    {dest.country}
                  </p>
                  <p
                    className="font-serif text-white font-medium"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: i === 0 ? 'clamp(1.4rem, 3vw, 2rem)' : '1.2rem',
                      lineHeight: 1.2,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {dest.location}
                  </p>
                  <p
                    className="text-xs mt-1.5"
                    style={{ color: 'rgba(247, 244, 239, 0.50)' }}
                  >
                    {dest.duration}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section
        style={{
          background: '#1A1814',
          padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 8vw, 8rem)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}
        >
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ color: '#C85F3C', letterSpacing: '0.16em' }}
          >
            Get started
          </p>
          <h2
            className="font-serif text-white mb-6"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            Your next trip,<br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
              planned intelligently.
            </span>
          </h2>
          <p
            className="text-base mb-10"
            style={{ color: 'rgba(247, 244, 239, 0.55)', lineHeight: 1.7 }}
          >
            Describe your dream trip and we will build the itinerary. Adjust anything, save it, and travel.
          </p>
          <Link
            to="/plan-trip"
            className="inline-flex items-center px-8 py-4 text-sm font-semibold transition-all duration-200"
            style={{
              background: '#F7F4EF',
              color: '#1A1814',
              borderRadius: '0.25rem',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#F7F4EF'}
          >
            Plan a trip
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer
        style={{
          background: '#120F0C',
          padding: '3rem clamp(1.5rem, 8vw, 8rem)',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '3rem',
            alignItems: 'start',
          }}
        >
          {/* Brand */}
          <div>
            <p
              className="font-serif font-medium mb-2"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                color: '#F7F4EF',
              }}
            >
              TripSmart
            </p>
            <p
              className="text-sm"
              style={{ color: 'rgba(247, 244, 239, 0.35)', maxWidth: 240, lineHeight: 1.6 }}
            >
              AI-powered travel planning for the thoughtful traveller.
            </p>
          </div>

          {/* Product */}
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: 'rgba(247, 244, 239, 0.35)', letterSpacing: '0.12em' }}
            >
              Product
            </p>
            <ul className="space-y-2">
              {[
                { label: 'Plan a trip', href: '/plan-trip' },
                { label: 'My trips', href: '/my-trips' },
                { label: 'About', href: '/about' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm transition-colors duration-150"
                    style={{ color: 'rgba(247, 244, 239, 0.55)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F7F4EF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(247, 244, 239, 0.55)'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: 'rgba(247, 244, 239, 0.35)', letterSpacing: '0.12em' }}
            >
              Legal
            </p>
            <ul className="space-y-2">
              {[
                { label: 'Terms of service', href: '/terms' },
                { label: 'Privacy policy', href: '/privacy' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm transition-colors duration-150"
                    style={{ color: 'rgba(247, 244, 239, 0.55)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F7F4EF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(247, 244, 239, 0.55)'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            maxWidth: 960,
            margin: '2.5rem auto 0',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(247, 244, 239, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <p className="text-xs" style={{ color: 'rgba(247, 244, 239, 0.28)' }}>
            &copy; {new Date().getFullYear()} TripSmart. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(247, 244, 239, 0.18)' }}>
            Made for travellers, by travellers.
          </p>
        </div>
      </footer>
    </div>
  );
}
