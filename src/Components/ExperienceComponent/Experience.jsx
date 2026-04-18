import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  aes,
  arduino,
  baller,
  bash,
  cloudflare,
  cpp,
  css,
  dremel,
  figma,
  fusion,
  gradle, java,
  javafx,
  js,
  knowinnotes,
  npm,
  python,
  react,
  rsa,
  scrum,
  sha256,
  sim20,
  SPGC,
  springboot,
  typescript,
  ubuntu,
  vite
} from '../../assets/logos_import';

import buckConverter from '../../assets/buck-converter.png';
import dtamr from '../../assets/DTAMR.png';
import emissionsbudget from '../../assets/emissionsbudget.png';
import madisco from '../../assets/madisco-logo.png';
import mountallison from '../../assets/mount_allison_logo.png';
import nbpower from '../../assets/nbpower_logo.png';
import ranzbontogon from '../../assets/ranz_bontogon_logo.png';
import solidworksLogo from '../../assets/SolidWorks_Logo.png';
import unb from '../../assets/unb_logo.png';
import NozzleSimulationSmall from '../PropulsionComponent/NozzleSimulationSmall';

const TechTag = ({ name, logo, url, invertOnLight }) => (
  <a href={url} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-subtle
               text-text-muted text-xs hover:border-border-default hover:text-text-primary
               transition-all duration-200 no-underline"
  >
    {logo && <img src={logo} alt={name} className={`w-4 h-4 object-contain rounded-sm ${invertOnLight ? 'theme-dark-on-light' : ''}`} />}
    <span>{name}</span>
  </a>
);

const ExperienceCard = ({ item, index, isAlternate = false, children, media = null, logo = null }) => {
  const isEven = index % 2 === 0;
  const layoutReversed = isAlternate && !isEven;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`
        bg-bg-card border border-border-subtle
        rounded-sm overflow-hidden
        transition-colors duration-300
        mb-5 sm:mb-6
      `}
    >
      <div className={`flex flex-col ${isAlternate ? (layoutReversed ? 'md:flex-row-reverse' : 'md:flex-row') : ''}`}>
        {media && (
          <div className="md:w-2/5 bg-bg-section flex items-center justify-center p-4 sm:p-6">
            {media}
          </div>
        )}
        <div className={`p-5 sm:p-8 ${media ? 'md:w-3/5' : 'w-full'}`}>
          <span className="text-xs sm:text-sm uppercase tracking-[0.25em] text-text-muted">{item.date}</span>
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-wide">
                {item.titleUrl && (
                  <><a href={item.titleUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-text-secondary transition-colors duration-200">{item.titleUrlText}</a>{': '}</>
                )}
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-sm text-text-muted mt-1">{item.subtitle}</p>
              )}
            </div>
            {logo && (
              <img
                src={logo}
                alt=""
                className="h-10 sm:h-12 w-auto object-contain theme-invert opacity-60 flex-shrink-0"
              />
            )}
          </div>
          <p className="text-base leading-relaxed text-text-secondary mt-3 sm:mt-4">{item.description}</p>
          {children && <div className="flex flex-wrap gap-2 mt-4 sm:mt-5">{children}</div>}
        </div>
      </div>
    </motion.div>
  );
};

export const Experience = () => {
  const [display, setDisplay] = useState('experience');
  const { t } = useTranslation();

  const tabs = [
    { id: 'projects', label: t('experience.selection.projects') },
    { id: 'experience', label: t('experience.selection.work') },
    { id: 'education', label: t('experience.selection.education') },
  ];

  return (
    <section id="experience1" className="py-20 sm:py-28 px-4 sm:px-6 bg-bg-base">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 sm:mb-18"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.12em] uppercase text-text-primary">
            Experience
          </h2>
          <div className="h-px w-12 bg-text-primary/55 mx-auto mt-4 sm:mt-5" />
        </motion.div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-10 sm:mb-14">
          <div className="inline-flex bg-bg-card border border-border-subtle rounded-full p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setDisplay(tab.id)}
                className={`
                  px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-[0.15em] font-medium
                  transition-all duration-300 cursor-pointer border-none
                  ${display === tab.id
                    ? 'bg-accent-bg text-accent-text'
                    : 'bg-transparent text-text-secondary hover:text-text-primary'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {display === 'projects' && (

            <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Supersonic Nozzle Project Card */}
              <ExperienceCard index={-2} isAlternate item={{
                date: t('experience.projects.nozzle.date'),
                title: t('experience.projects.nozzle.title'),
                subtitle: t('experience.projects.nozzle.subtitle'),
                description: t('experience.projects.nozzle.description')
              }} media={<NozzleSimulationSmall cameraPosition={[14.11, 12.96, -5.91]} />}> 
                <TechTag name="SolidWorks" logo={solidworksLogo} url="https://www.solidworks.com/" />
                <TechTag name="Python" logo={python} url="https://www.python.org/" />
              </ExperienceCard>

              <ExperienceCard index={-1} isAlternate item={{
                date: t('experience.projects.itemEB.date'),
                title: t('experience.projects.itemEB.title'),
                subtitle: t('experience.projects.itemEB.subtitle'),
                description: t('experience.projects.itemEB.description'),
                titleUrl: 'https://emissionsbudget.com/',
                titleUrlText: 'emissionsbudget.com',
              }} media={<img src={emissionsbudget} alt="EmissionsBudget Dashboard" className="w-full rounded-md" />}>
                <TechTag name="Python" logo={python} url="https://www.python.org/" />
                <TechTag name="JavaScript" logo={js} url="https://www.javascript.com/" />
                <TechTag name="TypeScript" logo={typescript} url="https://www.typescriptlang.org/" />
                <TechTag name="React" logo={react} url="https://react.dev/" />
                <TechTag name="Bash" logo={bash} url="https://mywiki.wooledge.org/BashGuide" invertOnLight />
                <TechTag name="Ubuntu" logo={ubuntu} url="https://design.ubuntu.com/brand" />
                <TechTag name="Cloudflare" logo={cloudflare} url="https://www.cloudflare.com/" />
                <TechTag name="npm" logo={npm} url="https://www.npmjs.com/" />
              </ExperienceCard>

              <ExperienceCard index={0} isAlternate item={{
                date: t('experience.projects.item0.date'),
                title: t('experience.projects.item0.title'),
                subtitle: t('experience.projects.item0.subtitle'),
                description: t('experience.projects.item0.description'),
              }} media={
                <div className="flex flex-col gap-4">
                  <img src={buckConverter} alt="Buck Converter Circuit" className="w-full rounded-md" />
                  <img src={dtamr} alt="AMR Diagram" className="w-full rounded-md" />
                </div>
              }>
                <TechTag name="20-sim" logo={sim20} url="https://www.20sim.com/" />
              </ExperienceCard>

              <ExperienceCard index={2} item={{
                date: t('experience.projects.item1.date'),
                title: t('experience.projects.item1.title'),
                subtitle: t('experience.projects.item1.subtitle'),
                description: t('experience.projects.item1.description'),
              }}>
                <TechTag name="Vite" logo={vite} url="https://vite.dev/" />
                <TechTag name="React" logo={react} url="https://react.dev/" />
                <TechTag name="JavaScript" logo={js} url="https://www.javascript.com/" />
                <TechTag name="CSS" logo={css} url="https://developer.mozilla.org/en-US/docs/Web/CSS" />
                <TechTag name="Cloudflare" logo={cloudflare} url="https://www.cloudflare.com/" />
                <TechTag name="Bash" logo={bash} url="https://mywiki.wooledge.org/BashGuide" invertOnLight />
                <TechTag name="Ubuntu Server" logo={ubuntu} url="https://design.ubuntu.com/brand" />
                <TechTag name="npm" logo={npm} url="https://www.npmjs.com/" />
              </ExperienceCard>

              <ExperienceCard index={3} isAlternate item={{
                date: t('experience.projects.item2.date'),
                title: t('experience.projects.item2.title'),
                subtitle: t('experience.projects.item2.subtitle'),
                description: t('experience.projects.item2.description'),
              }} media={<img src={knowinnotes} alt="Knowin Notes" className="w-full rounded-md" />}>
                <TechTag name="Spring Boot" logo={springboot} url="https://spring.io/projects/spring-boot" />
                <TechTag name="Gradle" logo={gradle} url="https://gradle.org/" invertOnLight />
                <TechTag name="Java" logo={java} url="https://www.java.com/" />
                <TechTag name="React" logo={react} url="https://react.dev/" />
                <TechTag name="Vite" logo={vite} url="https://vite.dev/" />
                <TechTag name="Figma" logo={figma} url="https://www.figma.com/" />
                <TechTag name="Scrum" logo={scrum} url="https://www.scrum.org/" />
                <TechTag name="CSS" logo={css} url="https://developer.mozilla.org/en-US/docs/Web/CSS" />
              </ExperienceCard>

              <ExperienceCard index={4} isAlternate item={{
                date: t('experience.projects.item3.date'),
                title: t('experience.projects.item3.title'),
                subtitle: t('experience.projects.item3.subtitle'),
                description: t('experience.projects.item3.description'),
              }} media={<img src={SPGC} alt="Encrypted Messaging" className="w-full rounded-md" />}>
                <TechTag name="JavaFX" logo={javafx} url="https://openjfx.io/" />
                <TechTag name="Java" logo={java} url="https://www.java.com/" />
                <TechTag name="RSA" logo={rsa} url="https://www.devglan.com/online-tools/rsa-encryption-decryption" />
                <TechTag name="AES" logo={aes} url="https://www.devglan.com/online-tools/aes-encryption-decryption" />
                <TechTag name="SHA-256" logo={sha256} url="https://www.devglan.com/online-tools/hmac-sha256-online" />
              </ExperienceCard>

              <ExperienceCard index={5} isAlternate item={{
                date: t('experience.projects.item4.date'),
                title: t('experience.projects.item4.title'),
                subtitle: t('experience.projects.item4.subtitle'),
                description: t('experience.projects.item4.description'),
              }} media={<video src={baller} className="w-full rounded-md" autoPlay loop muted playsInline />}>
                <TechTag name="C++" logo={cpp} url="https://cplusplus.com/" />
                <TechTag name="Arduino" logo={arduino} url="https://www.arduino.cc/" />
                <TechTag name="Fusion 360" logo={fusion} url="https://www.autodesk.com/ca-en/products/fusion-360/personal" />
                <TechTag name="3D Printing" logo={dremel} url="https://www.dremel.com/gn/en/digilab" />
              </ExperienceCard>
            </motion.div>
          )}

          {display === 'experience' && (
            <motion.div key="experience" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ExperienceCard index={0} logo={nbpower} item={{
                date: t('experience.work.item5.date'),
                title: t('experience.work.item5.title'),
                subtitle: t('experience.work.item5.subtitle'),
                description: t('experience.work.item5.description'),
              }} />
              <ExperienceCard index={1} logo={nbpower} item={{
                date: t('experience.work.item1.date'),
                title: t('experience.work.item1.title'),
                subtitle: t('experience.work.item1.subtitle') || 'NB Power | Bathurst (NB)',
                description: t('experience.work.item1.description'),
              }} />
              <ExperienceCard index={2} logo={ranzbontogon} item={{
                date: t('experience.work.item2.date'),
                title: t('experience.work.item2.title'),
                subtitle: t('experience.work.item2.subtitle') || '',
                description: t('experience.work.item2.description'),
              }} />
              <ExperienceCard index={3} logo={madisco} item={{
                date: t('experience.work.item3.date'),
                title: t('experience.work.item3.title'),
                subtitle: t('experience.work.item3.subtitle') || '',
                description: t('experience.work.item3.description'),
              }} />
              <ExperienceCard index={4} logo={mountallison} item={{
                date: t('experience.work.item4.date'),
                title: t('experience.work.item4.title'),
                subtitle: t('experience.work.item4.subtitle') || '',
                description: t('experience.work.item4.description'),
              }} />
            </motion.div>
          )}

          {display === 'education' && (
            <motion.div key="education" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ExperienceCard index={0} logo={unb} item={{
                date: t('experience.education.item1.date'),
                title: t('experience.education.item1.title'),
                subtitle: t('experience.education.item1.subtitle') || 'University of New Brunswick | Fredericton (NB)',
                description: t('experience.education.item1.description'),
              }} />
              <ExperienceCard index={1} logo={mountallison} item={{
                date: t('experience.education.item2.date'),
                title: t('experience.education.item2.title'),
                subtitle: t('experience.education.item2.subtitle') || 'Mount Allison University | Sackville (NB)',
                description: t('experience.education.item2.description'),
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Experience;
