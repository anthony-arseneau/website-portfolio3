import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import canadaFlag from '../../assets/canada_flag.png';
import profilePic from '../../assets/profile.jpg';

function Hero() {
  const { t } = useTranslation();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative w-full min-h-screen flex flex-col items-center justify-center bg-bg-base px-4">
      {/* Row 1: PFP + Name & Location */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="relative z-10 flex items-center gap-4 sm:gap-5"
      >
        <img
          src={profilePic}
          alt="Anthony Arseneau"
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-border-subtle shrink-0"
        />
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-wide">
            Anthony Arseneau
          </h2>
          <a
            href="https://www.google.com/maps/place/Fredericton,+NB/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-1 text-text-muted hover:text-text-primary
                       transition-colors duration-200 no-underline"
          >
            <span className="text-sm tracking-wide">{t('location')}</span>
            <img src={canadaFlag} alt="Canada" className="h-3.5 rounded-sm shrink-0" />
          </a>
        </div>
      </motion.div>

      {/* Row 2: Big title, centered */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35 }}
        className="relative z-10 text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary tracking-wide uppercase mt-8 sm:mt-10 max-w-5xl"
      >
        {t('hero_title')}
      </motion.h1>

      {/* CTA button */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="relative z-10 mt-12 sm:mt-16 text-center"
      >
        <button
          onClick={() => scrollTo('propulsion')}
          className="px-8 sm:px-10 py-3 border border-border-default text-text-primary text-[11px] sm:text-xs uppercase tracking-[0.35em]
                     bg-transparent hover:bg-accent-bg hover:text-accent-text transition-all duration-300 cursor-pointer font-medium"
        >
          {t('hero_cta')}
        </button>

        {/* Animated scroll arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <motion.svg
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-6 h-6 mx-auto text-text-muted"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </motion.svg>
        </motion.div>
      </motion.div>

      {/* Subtle bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-base to-transparent z-[1]" />
    </section>
  );
}

export default Hero;
