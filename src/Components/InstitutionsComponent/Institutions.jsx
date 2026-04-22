import { motion } from 'framer-motion';

import icpc from '../../assets/ICPC Logo.png';
import mountallison from '../../assets/mount_allison_logo.png';
import nbpower from '../../assets/nbpower_logo.png';
import scienceatlantic from '../../assets/Science Atlantic Logo.png';
import unb from '../../assets/unb_logo.png';

const institutions = [
  { name: 'University of New Brunswick', logo: unb, url: 'https://www.unb.ca/' },
  { name: 'Mount Allison University', logo: mountallison, url: 'https://mta.ca/' },
  { name: 'NB Power', logo: nbpower, url: 'https://www.nbpower.com/' },
  { name: 'Science Atlantic', logo: scienceatlantic, url: 'https://scienceatlantic.ca/' },
  { name: 'ICPC', logo: icpc, url: 'https://ne.na.icpc.global/' },
];

const Institutions = () => {
  // Duplicate logos for seamless infinite scroll
  const doubled = [...institutions, ...institutions];

  return (
    <section className="py-10 sm:py-14 bg-bg-base overflow-hidden">
      <div className="relative w-full">
        <motion.div
          className="flex w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 40,
              ease: 'linear',
            },
          }}
        >
          {doubled.map((inst, i) => (
            <a
              key={`${inst.name}-${i}`}
              href={inst.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-10 sm:px-12"
            >
              <img
                src={inst.logo}
                alt={inst.name}
                className="h-12 sm:h-14 md:h-16 w-auto object-contain
                           theme-invert opacity-70
                           hover:opacity-100
                           transition-all duration-300 cursor-pointer"
              />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Institutions;
