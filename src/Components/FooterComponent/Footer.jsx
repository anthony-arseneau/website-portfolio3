import { useTranslation } from 'react-i18next';
import { FaRegFileAlt } from 'react-icons/fa';
import { FaLinkedinIn } from 'react-icons/fa6';
import { FiGithub } from 'react-icons/fi';
import { LuSend } from 'react-icons/lu';
import resume from '../../assets/public_resume.pdf';

const Footer = () => {
  const { t } = useTranslation();

  const handleResumeClick = (e) => {
    e.preventDefault();
    window.open(resume, '_blank');
    const link = document.createElement('a');
    link.href = resume;
    link.download = 'resume_anthony_arseneau.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 bg-black border-t border-white/[0.05]">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <a
            href="https://linkedin.com/in/anthonyarseneau"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/[0.08]
                       text-white/30 hover:text-white hover:border-white/25
                       transition-all duration-300 no-underline"
          >
            <FaLinkedinIn size={13} />
          </a>
          <a
            href="https://github.com/anthony-arseneau"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/[0.08]
                       text-white/30 hover:text-white hover:border-white/25
                       transition-all duration-300 no-underline"
          >
            <FiGithub size={13} />
          </a>
          <a
            href={resume}
            onClick={handleResumeClick}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/[0.08]
                       text-white/30 hover:text-white hover:border-white/25
                       transition-all duration-300 no-underline"
          >
            <FaRegFileAlt size={13} />
          </a>
          <a
            href="mailto:contact@anthonyarseneau.ca"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/[0.08]
                       text-white/30 hover:text-white hover:border-white/25
                       transition-all duration-300 no-underline"
          >
            <LuSend size={13} />
          </a>
        </div>
        <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase">
          {t('last_updated')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
