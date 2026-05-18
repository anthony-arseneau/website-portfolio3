import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  aes,
  arduino,
  autodesk,
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
  powerbi,
  python,
  react,
  rsa,
  sap,
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

import commercetrip1 from '../../assets/commercetrip1.png';
import datachallenge from '../../assets/datachallenge.png';
import postAcceptanceLetter from '../../assets/posts/acceptance_letter.png';
import postDataviz from '../../assets/posts/dataviz_competition.png';
import postDeansList from '../../assets/posts/deans_list.png';
import postScienceAtlantic from '../../assets/posts/science_atlantic.png';
import postScienceAtlantic2 from '../../assets/posts/science_atlantic2.png';
import postScienceAtlantic3 from '../../assets/posts/Science_atlantic3.png';
import postToronto1 from '../../assets/posts/toronto1.png';
import postToronto2 from '../../assets/posts/toronto2.png';
import postToronto3 from '../../assets/posts/toronto3.png';

import acadiauniversity from '../../assets/acadiauniversity.png';
import bellmedia from '../../assets/bellmedia.png';
import cibc from '../../assets/cibc.png';
import commerceSociety from '../../assets/commerce_society.png';
import dalhousieuniversity from '../../assets/dalhousieuniversity.png';
import deloitte from '../../assets/deloitte.png';
import emera from '../../assets/emera.png';
import paradigmcapital from '../../assets/paradigmcapital.png';
import pier21 from '../../assets/pier21.svg';
import scienceAtlantic from '../../assets/Science Atlantic Logo.png';
import vestcor from '../../assets/vestcor.png';

const getRelativeTime = (dateObj) => {
  if (!dateObj) return null;
  const now = new Date();
  const totalMonths = (now.getFullYear() - dateObj.getFullYear()) * 12 + (now.getMonth() - dateObj.getMonth());
  const diffDays = Math.floor((now - dateObj) / 86400000);
  if (diffDays < 7) return 'this week';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  if (totalMonths < 12) return `${totalMonths} month${totalMonths !== 1 ? 's' : ''} ago`;
  const years = Math.floor(totalMonths / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

const Lightbox = ({ src, onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
    onClick={onClose}
  >
    <img
      src={src}
      alt="Expanded view of image - Anthony Arseneau Portfolio"
      className="max-w-[90vw] max-h-[90vh] object-contain"
      onClick={e => e.stopPropagation()}
    />
  </div>
);

const ClickableImage = ({ src, alt = '', className = '' }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className} cursor-pointer theme-hover-dim transition-[filter]`}
        onClick={() => setOpen(true)}
      />
      {open && <Lightbox src={src} onClose={() => setOpen(false)} />}
    </>
  );
};

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
    <div
      className={`
        bg-bg-card border border-border-subtle
        rounded-sm overflow-hidden
        transition-colors duration-300
        mb-5 sm:mb-6
      `}
    >
      <div className="flex flex-col">
        <div className={media ? 'pt-5 sm:pt-8 px-5 sm:px-8 pb-4 sm:pb-5' : 'p-5 sm:p-8'}>
          <span className="text-xs sm:text-sm tracking-[0.25em] text-text-muted">{item.date}</span>
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-wide">
                {item.titleUrl && (
                  <><a href={item.titleUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-text-secondary transition-colors duration-200">{item.titleUrlText}</a>{': '}</>
                )}
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-sm text-text-muted mt-1">
                  {item.subtitleUrl
                    ? <a href={item.subtitleUrl} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors duration-200">{item.subtitle}</a>
                    : item.subtitle}
                </p>
              )}
            </div>
            {logo && (
              <img
                src={logo}
                alt={`${item.title} company logo - Anthony Arseneau`}
                className={`h-10 sm:h-12 w-auto object-contain theme-invert opacity-60 flex-shrink-0 ${logo === vestcor ? 'max-w-[100px]' : ''}`}
              />
            )}
          </div>
          <p className="text-base leading-relaxed text-text-secondary mt-3 sm:mt-4">{item.description}</p>
          {children && <div className="flex flex-wrap gap-2 mt-2">{children}</div>}
        </div>
        {media && (
          <div className="px-5 sm:px-8 pb-5 sm:pb-6">
            {media}
          </div>
        )}
      </div>
    </div>
  );
};

const BlogPostCard = ({ post, index }) => {
  const [expanded, setExpanded] = useState(false);
  const relativeTime = getRelativeTime(post.dateObj);

  return (
    <div
      className="bg-bg-card border border-border-subtle rounded-sm overflow-hidden transition-colors duration-300 mb-5 sm:mb-6"
    >
      <div className={`pt-5 sm:pt-8 px-5 sm:px-8 ${post.images ? 'pb-3' : 'pb-5 sm:pb-8'}`}>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xs sm:text-sm text-text-muted tracking-[0.25em]">{post.date}</span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-wide">{post.title}</h3>
            {post.subtitle && (
              <p className="text-sm text-text-muted mt-1">
                {post.subtitleUrl
                  ? <a href={post.subtitleUrl} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors duration-200">{post.subtitle}</a>
                  : post.subtitle}
              </p>
            )}
          </div>
          {post.logo && (
            post.logoText ? (
              <div className="flex items-stretch gap-2 flex-shrink-0 theme-invert opacity-60 h-10 sm:h-12">
                <img
                  src={post.logo}
                  alt={`Logo for ${post.title} - Anthony Arseneau`}
                  className="h-full w-auto object-contain"
                />
                <div className="flex flex-col justify-center gap-1">
                  {post.logoText.map((line, i) => (
                    <span key={i} className="font-serif text-xs sm:text-sm leading-none">{line}</span>
                  ))}
                </div>
              </div>
            ) : (
              <img
                src={post.logo}
                alt={`Logo for ${post.title} - Anthony Arseneau`}
                className={`h-10 sm:h-12 w-auto object-contain theme-invert opacity-60 flex-shrink-0 ${post.logo === vestcor ? 'max-w-[100px]' : ''}`}
              />
            )
          )}
        </div>
        <p className="text-base leading-relaxed text-text-secondary mt-3 sm:mt-4">
          {post.briefContent ?? post.brief}
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-text-muted cursor-pointer bg-transparent border-none p-0 ml-1 inline text-base hover:text-text-secondary transition-colors duration-200"
            >
              ... more
            </button>
          )}
        </p>
        {expanded && (
          <div className="text-base leading-relaxed text-text-secondary mt-2">
            {post.expandedContent ?? post.expanded}
            {post.link && post.link.label && (
              <>{' '}<a href={post.link.href} target="_blank" rel="noopener noreferrer" className="text-text-primary underline hover:opacity-70 transition-opacity duration-200">{post.link.label}</a>.</>
            )}
            {' '}
            <button
              onClick={() => setExpanded(false)}
              className="text-text-muted cursor-pointer bg-transparent border-none p-0 ml-1 inline text-base hover:text-text-secondary transition-colors duration-200"
            >
              ... hide
            </button>
          </div>
        )}
        {post.tags && (
          <div className="flex flex-wrap gap-2 mt-2 mb-1">
            {post.tags.map((tag, i) => React.cloneElement(tag, { key: i }))}
          </div>
        )}
      </div>

      {post.images && post.images.length === 1 && (() => {
        if (post.link?.href) {
          const domain = new URL(post.link.href).hostname.replace('www.', '');
          const title = post.link.label || post.title;
          return (
            <div className="px-5 sm:px-8 pb-5 sm:pb-6 flex flex-col items-center">
              <a
                href={post.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col rounded-xl overflow-hidden border border-border-default no-underline cursor-pointer transition-opacity hover:opacity-90 bg-bg-base w-full max-w-sm"
              >
                <img src={post.images[0]} alt={`${post.title} image - Anthony Arseneau`} className="w-full object-cover" />
                <div className="p-3 sm:p-4 flex flex-col gap-1 border-t border-border-default">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                      alt={`${domain} favicon`}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80"
                    />
                    <span className="text-[0.7rem] sm:text-xs text-text-muted">{domain}</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-text-primary leading-snug mt-0.5">{title}</div>
                </div>
              </a>
            </div>
          );
        }
        return (
          <div className="px-5 sm:px-8 pb-5 sm:pb-6 flex justify-center">
            <ClickableImage src={post.images[0]} alt={`${post.title} image - Anthony Arseneau`} className="max-h-80 max-w-full" />
          </div>
        );
      })()}

      {post.images && post.images.length === 3 && (() => {
        const ImageGrid = () => (
          <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full bg-border-subtle" style={{ aspectRatio: '3/2' }}>
            <div className="col-span-2 row-span-2">
              <img src={post.images[0]} alt={`${post.title} photo 1 - Anthony Arseneau`} className="w-full h-full object-cover block m-0 p-0" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={post.images[1]} alt={`${post.title} photo 2 - Anthony Arseneau`} className="w-full h-full object-cover block m-0 p-0" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={post.images[2]} alt={`${post.title} photo 3 - Anthony Arseneau`} className="w-full h-full object-cover block m-0 p-0" />
            </div>
          </div>
        );

        if (post.link?.href) {
          const domain = new URL(post.link.href).hostname.replace('www.', '');
          const title = post.link.label || post.title;
          
          return (
            <div className="px-5 sm:px-8 pb-5 sm:pb-6 flex flex-col items-center">
              <a
                href={post.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col rounded-xl overflow-hidden border border-border-default no-underline cursor-pointer transition-opacity hover:opacity-90 bg-bg-base w-full max-w-sm"
              >
                <ImageGrid />
                <div className="p-3 sm:p-4 flex flex-col gap-1 border-t border-border-default">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                      alt={`${domain} favicon`}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80"
                    />
                    <span className="text-[0.7rem] sm:text-xs text-text-muted">{domain}</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-text-primary leading-snug mt-0.5">
                    {title}
                  </div>
                </div>
              </a>
            </div>
          );
        }

        return (
          <div className="px-5 sm:px-8 pb-5 sm:pb-6 flex flex-col">
            <div className="rounded-xl overflow-hidden flex flex-col">
              <ImageGrid />
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export const Experience = () => {
  const [display, setDisplay] = useState('experience');
  const { t } = useTranslation();

  const tabs = [
    { id: 'projects', label: t('experience.selection.projects') },
    { id: 'experience', label: t('experience.selection.work') },
    { id: 'education', label: t('experience.selection.education') },
    { id: 'posts', label: t('experience.selection.posts') },
  ];

  return (
    <section id="experience1" className="py-20 sm:py-28 px-4 sm:px-6 bg-bg-base">
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div
          className="text-center mb-14 sm:mb-18"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.12em] uppercase text-text-primary">
            {t('experience_')}
          </h2>
          <div className="h-px w-12 bg-text-primary/55 mx-auto mt-4 sm:mt-5" />
        </div>

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
              }} media={<div className="h-64 sm:h-80 bg-bg-card"><NozzleSimulationSmall cameraPosition={[14.11, 12.96, -5.91]} /></div>}> 
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
              }} media={<ClickableImage src={emissionsbudget} alt="EmissionsBudget Dashboard" className="w-full object-contain max-h-72 bg-bg-card" />}>
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
                <div className="flex flex-col gap-px bg-bg-card">
                  <ClickableImage src={buckConverter} alt="Buck Converter Circuit" className="w-full object-contain max-h-56 bg-bg-card" />
                  <ClickableImage src={dtamr} alt="AMR Diagram" className="w-full object-contain max-h-56 bg-bg-card" />
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
              }} media={<ClickableImage src={knowinnotes} alt="Knowin Notes" className="w-full object-contain max-h-72 bg-bg-card" />}>
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
              }} media={<ClickableImage src={SPGC} alt="Encrypted Messaging" className="w-full object-contain max-h-72 bg-bg-card" />}>
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
              }} media={<video src={baller} className="w-full object-contain max-h-72 bg-bg-card" autoPlay loop muted playsInline />}>
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
                subtitleUrl: 'https://maps.google.com/?q=Belledune,+NB,+Canada',
                description: t('experience.work.item5.description'),
              }}>
                <TechTag name="SAP" logo={sap} url="https://www.sap.com/" />
                <TechTag name="AutoSketch" logo={autodesk} url="https://www.autodesk.com/" />
              </ExperienceCard>
              <ExperienceCard index={1} logo={nbpower} item={{
                date: t('experience.work.item1.date'),
                title: t('experience.work.item1.title'),
                subtitle: t('experience.work.item1.subtitle') || 'NB Power | Bathurst (NB)',
                subtitleUrl: 'https://maps.google.com/?q=Bathurst,+NB,+Canada',
                description: t('experience.work.item1.description'),
              }} />
              <ExperienceCard index={2} logo={ranzbontogon} item={{
                date: t('experience.work.item2.date'),
                title: t('experience.work.item2.title'),
                subtitle: t('experience.work.item2.subtitle') || '',
                subtitleUrl: 'https://maps.google.com/?q=Moncton,+NB,+Canada',
                description: t('experience.work.item2.description'),
              }} />
              <ExperienceCard index={3} logo={madisco} item={{
                date: t('experience.work.item3.date'),
                title: t('experience.work.item3.title'),
                subtitle: t('experience.work.item3.subtitle') || '',
                subtitleUrl: 'https://maps.google.com/?q=Bathurst,+NB,+Canada',
                description: t('experience.work.item3.description'),
              }} />
              <ExperienceCard index={4} logo={mountallison} item={{
                date: t('experience.work.item4.date'),
                title: t('experience.work.item4.title'),
                subtitle: t('experience.work.item4.subtitle') || '',
                subtitleUrl: 'https://maps.google.com/?q=Sackville,+NB,+Canada',
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
                subtitleUrl: 'https://maps.google.com/?q=Fredericton,+NB,+Canada',
                description: t('experience.education.item1.description'),
              }} />
              <ExperienceCard index={1} logo={mountallison} item={{
                date: t('experience.education.item2.date'),
                title: t('experience.education.item2.title'),
                subtitle: t('experience.education.item2.subtitle') || 'Mount Allison University | Sackville (NB)',
                subtitleUrl: 'https://maps.google.com/?q=Sackville,+NB,+Canada',
                description: t('experience.education.item2.description'),
              }} />
            </motion.div>
          )}

          {display === 'posts' && (
            <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {[
                {
                  date: t('experience.posts.post2.date'),
                  dateObj: new Date(2025, 11),
                  title: t('experience.posts.post2.title'),
                  subtitle: t('experience.posts.post2.subtitle'),
                  subtitleUrl: 'https://maps.google.com/?q=Fredericton,+NB,+Canada',
                  brief: t('experience.posts.post2.brief'),
                  briefContent: (
                    <>{t('experience.posts.post2.briefPre')} <a href="https://www.unb.ca/fredericton/management/ibec/data-challenge.html" target="_blank" rel="noopener noreferrer" title="UNB Data Challenge – Presented by Vestcor" aria-label="UNB Data Challenge competition page" className="inline-flex items-center gap-1 no-underline text-blue-600 hover:opacity-75 transition-opacity duration-200 align-middle"><img src={datachallenge} alt="UNB Data Challenge logo" className="inline h-4 w-auto object-contain" /><span className="underline underline-offset-2">Data Challenge</span></a> {t('experience.posts.post2.briefMid')} <a href="https://vestcor.org/en/" target="_blank" rel="noopener noreferrer" title="Vestcor – Institutional investment manager" aria-label="Visit Vestcor website" className="inline-flex items-center gap-1 no-underline text-blue-600 hover:opacity-75 transition-opacity duration-200 align-middle"><img src={vestcor} alt="Vestcor logo" className="inline h-4 w-auto max-w-[48px] object-contain theme-invert-dark" /><span className="underline underline-offset-2">{t('experience.posts.post2.briefVestcor')}</span></a>.</>
                  ),
                  expanded: t('experience.posts.post2.expanded'),
                  images: [postDataviz],
                  logo: vestcor,
                  tags: [
                    <TechTag name="Power BI" logo={powerbi} url="https://powerbi.microsoft.com/" />,
                    <TechTag name="JavaScript" logo={js} url="https://developer.mozilla.org/en-US/docs/Web/JavaScript" />
                  ],
                },
                {
                  date: t('experience.posts.post3.date'),
                  dateObj: new Date(2025, 4),
                  title: t('experience.posts.post3.title'),
                  subtitle: t('experience.posts.post3.subtitle'),
                  subtitleUrl: 'https://maps.google.com/?q=Sackville,+NB,+Canada',
                  brief: t('experience.posts.post3.brief'),
                  expanded: t('experience.posts.post3.expanded'),
                  images: [postDeansList],
                  logo: mountallison,
                },
                {
                  date: t('experience.posts.post4.date'),
                  dateObj: new Date(2025, 1),
                  title: t('experience.posts.post4.title'),
                  subtitle: t('experience.posts.post4.subtitle'),
                  subtitleUrl: 'https://maps.google.com/?q=Toronto,+ON,+Canada',
                  brief: t('experience.posts.post4.brief'),
                  expanded: t('experience.posts.post4.expanded'),
                  images: [postToronto1, postToronto2, postToronto3],
                  link: { href: 'https://www.instagram.com/p/DGWbMvCRFbY/?img_index=1' },
                  logo: commerceSociety,
                  logoText: ['Mount Allison', 'Commerce Society'],
                  expandedContent: (
                    <p>We had the incredible chance to visit{
                      [['CIBC Square', 'https://www.cibc.com/', cibc, null, 'CIBC – Canadian Imperial Bank of Commerce'],
                       ['Deloitte', 'https://www.deloitte.com/', deloitte, null, 'Deloitte – Professional services firm'],
                       ['Bell Media', 'https://www.bellmedia.ca/', bellmedia, null, 'Bell Media – Canadian media company'],
                       ['Paradigm Capital', 'https://www.paradigmcap.com/', paradigmcapital, null, 'Paradigm Capital – Investment dealer']
                      ].map(([name, url, logo, domain, title], i, arr) => (
                        <React.Fragment key={name}>
                          {i === arr.length - 1 ? ', and ' : ', '}
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            title={title}
                            aria-label={`Visit ${name} website`}
                            className="inline-flex items-center gap-1 no-underline text-blue-600 hover:opacity-75 transition-opacity duration-200 align-middle"
                          >
                            {logo
                              ? <img src={logo} alt={`${name} logo`} className="inline h-4 w-auto object-contain theme-invert-dark" />
                              : <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={`${name} favicon`} className="inline h-4 w-4 object-contain" />
                            }
                            <span className="underline underline-offset-2">{name}</span>
                          </a>
                        </React.Fragment>
                      ))
                    }, expanding our professional networks and learning directly from industry leaders in the heart of the financial district.</p>
                  ),
                },
                {
                  date: t('experience.posts.post6.date'),
                  dateObj: new Date(2024, 10),
                  title: t('experience.posts.post6.title'),
                  subtitle: t('experience.posts.post6.subtitle'),
                  subtitleUrl: 'https://maps.google.com/?q=Halifax,+NS,+Canada',
                  brief: t('experience.posts.post6.brief'),
                  expanded: t('experience.posts.post6.expanded'),
                  images: [commercetrip1],
                  link: { href: 'https://www.instagram.com/p/DCVfp6ORc0Y/?img_index=1' },
                  logo: commerceSociety,
                  logoText: ['Mount Allison', 'Commerce Society'],
                  expandedContent: (
                    <p>We had the incredible chance to visit{
                      [['Emera', 'https://www.emera.com/', emera, null, 'Emera – Energy company'],
                       ['Pier 21', 'https://pier21.ca/', pier21, null, 'Pier 21 – Canadian Museum of Immigration'],
                       ['Dalhousie University', 'https://www.dal.ca/', dalhousieuniversity, null, 'Dalhousie University – Halifax, NS']
                      ].map(([name, url, logo, domain, title], i, arr) => (
                        <React.Fragment key={name}>
                          {i === arr.length - 1 ? ', and ' : ', '}
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            title={title}
                            aria-label={`Visit ${name} website`}
                            className="inline-flex items-center gap-1 no-underline text-blue-600 hover:opacity-75 transition-opacity duration-200 align-middle"
                          >
                            {logo
                              ? <img src={logo} alt={`${name} logo`} className="inline h-4 w-auto object-contain theme-invert-dark" />
                              : <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={`${name} favicon`} className="inline h-4 w-4 object-contain" />
                            }
                            <span className="underline underline-offset-2">{name}</span>
                          </a>
                        </React.Fragment>
                      ))
                    }, expanding our professional networks and learning from industry and cultural leaders in the heart of Halifax.</p>
                  ),
                },
                {
                  date: t('experience.posts.post1.date'),
                  dateObj: new Date(2025, 0),
                  title: t('experience.posts.post1.title'),
                  subtitle: t('experience.posts.post1.subtitle'),
                  subtitleUrl: 'https://maps.google.com/?q=Fredericton,+NB,+Canada',
                  brief: t('experience.posts.post1.brief'),
                  expanded: t('experience.posts.post1.expanded'),
                  images: [postAcceptanceLetter],
                  logo: unb,
                },
                {
                  date: t('experience.posts.post5.date'),
                  dateObj: new Date(2024, 9, 21),
                  title: t('experience.posts.post5.title'),
                  subtitle: t('experience.posts.post5.subtitle'),
                  subtitleUrl: 'https://maps.google.com/?q=Wolfville,+NS,+Canada',
                  brief: t('experience.posts.post5.brief'),
                  briefContent: (
                    <>{t('experience.posts.post5.briefPreSA')} <a href="https://scienceatlantic.ca/news/cs-2024-award-winners/" target="_blank" rel="noopener noreferrer" title="Science Atlantic – 2024 CS Award Winners" aria-label="Science Atlantic 2024 CS Award Winners page" className="inline-flex items-center gap-1 no-underline text-blue-600 hover:opacity-75 transition-opacity duration-200 align-middle"><img src={scienceAtlantic} alt="Science Atlantic logo" className="inline h-5 w-auto object-contain theme-invert-dark" /><span className="underline underline-offset-2">Science Atlantic</span></a> {t('experience.posts.post5.briefPostSA')} <a href="https://www2.acadiau.ca/" target="_blank" rel="noopener noreferrer" title="Acadia University – Wolfville, NS" aria-label="Visit Acadia University website" className="inline-flex items-center gap-1 no-underline text-blue-600 hover:opacity-75 transition-opacity duration-200 align-middle"><img src={acadiauniversity} alt="Acadia University logo" className="inline h-4 w-auto object-contain theme-invert-dark" /><span className="underline underline-offset-2">{t('experience.posts.post5.briefUniversity')}</span></a>!</>
                  ),
                  expanded: t('experience.posts.post5.expanded'),
                  images: [postScienceAtlantic, postScienceAtlantic2, postScienceAtlantic3],
                  link: { href: 'https://scienceatlantic.ca/news/cs-2024-award-winners/' },
                  logo: scienceAtlantic,
                  tags: [
                    <TechTag name="Python" logo={python} url="https://www.python.org/" />,
                    <TechTag name="Java" logo={java} url="https://www.java.com/" />
                  ],
                },
              ].map((post, i) => (
                <BlogPostCard key={i} post={post} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Experience;
