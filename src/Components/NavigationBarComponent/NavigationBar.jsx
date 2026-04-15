import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaRegFileAlt } from 'react-icons/fa';
import { FaLinkedinIn } from 'react-icons/fa6';
import { FiGithub } from 'react-icons/fi';
import { LuSend } from 'react-icons/lu';
import resume from '../../assets/public_resume.pdf';

const NavigationBar = () => {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState('EN');

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > lastY.current && y > 60) {
          setVisible(false);
        } else if (y < lastY.current) {
          setVisible(true);
        }
        lastY.current = y;
        ticking.current = false;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const toggleLanguage = () => {
    const next = language === 'EN' ? 'FR' : 'EN';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  const handleResume = (e) => {
    e.preventDefault();
    window.open(resume, '_blank');
    const a = document.createElement('a');
    a.href = resume;
    a.download = 'resume_anthony_arseneau.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <nav
      style={{ transform: visible ? 'translateY(0)' : 'translateY(-100%)' }}
      className="fixed top-0 w-full z-50 bg-black text-white px-4 sm:px-6 py-3 border-b border-white/5 transition-transform duration-200 ease-out"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left: monogram + name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => scrollTo('home')} className="bg-transparent border-none text-white cursor-pointer p-0 flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-sm sm:text-base font-bold tracking-[0.25em] uppercase shrink-0">AA</span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-xs sm:text-sm tracking-[0.15em] uppercase text-gray-300 hidden sm:inline truncate">
              Anthony Arseneau
            </span>
          </button>
        </div>

        {/* Center: nav links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { id: 'home', label: t('home') },
            { id: 'experience1', label: t('experience_') },
            { id: 'tech-stack', label: 'Tech Stack' },
          ].map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-xs uppercase tracking-[0.2em] text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer px-1 py-1"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right: icons + FR toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <a href="https://linkedin.com/in/anthonyarseneau" target="_blank" rel="noopener noreferrer"
            className="p-2 text-gray-300 hover:text-white transition-colors no-underline" title="LinkedIn">
            <FaLinkedinIn size={14} />
          </a>
          <a href="https://github.com/anthony-arseneau" target="_blank" rel="noopener noreferrer"
            className="p-2 text-gray-300 hover:text-white transition-colors no-underline" title="GitHub">
            <FiGithub size={14} />
          </a>
          <a href={resume} onClick={handleResume}
            className="p-2 text-gray-300 hover:text-white transition-colors no-underline" title="Resume">
            <FaRegFileAlt size={14} />
          </a>
          <a href="mailto:contact@anthonyarseneau.ca"
            className="p-2 text-gray-300 hover:text-white transition-colors no-underline" title="Email">
            <LuSend size={14} />
          </a>
          <div className="w-px h-4 bg-white/10 mx-1 sm:mx-2" />
          <button
            onClick={toggleLanguage}
            className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer px-1 sm:px-2 py-1"
          >
            {language === 'EN' ? 'FR' : 'EN'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
