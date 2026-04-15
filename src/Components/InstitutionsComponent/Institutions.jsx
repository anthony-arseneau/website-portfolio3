import React from 'react';
import { motion } from 'framer-motion';

import unb from '../../assets/unb_logo.png';
import mountallison from '../../assets/mount_allison_logo.png';
import nbpower from '../../assets/nbpower_logo.png';
import scienceatlantic from '../../assets/Science Atlantic Logo.png';
import icpc from '../../assets/ICPC Logo.png';

const institutions = [
  { name: 'University of New Brunswick', logo: unb, url: 'https://www.unb.ca/' },
  { name: 'Mount Allison University', logo: mountallison, url: 'https://mta.ca/' },
  { name: 'NB Power', logo: nbpower, url: 'https://www.nbpower.com/' },
  { name: 'Science Atlantic', logo: scienceatlantic, url: 'https://scienceatlantic.ca/' },
  { name: 'ICPC', logo: icpc, url: 'https://ne.na.icpc.global/' },
];

const Institutions = () => {
  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-14 md:gap-20">
          {institutions.map((inst, i) => (
            <motion.a
              key={inst.name}
              href={inst.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="group"
            >
              <img
                src={inst.logo}
                alt={inst.name}
                className="h-8 sm:h-10 md:h-12 object-contain
                           grayscale opacity-30
                           group-hover:grayscale-0 group-hover:opacity-100
                           transition-all duration-300"
              />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Institutions;
