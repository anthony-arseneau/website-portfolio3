import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CountUp from '../HeroComponent/CountUp';
import F1CfdSimulation from './F1CfdSimulation';
import NozzleSimulation from './NozzleSimulation';

// Which 3D visual this section shows.
// 'f1'     -> F1 CFD pathlines (Ansys Fluent)
// 'nozzle' -> original rocket nozzle / thruster animation
const SECTION_VISUAL = 'f1';

function PropulsionMetrics() {
  const { t } = useTranslation();

  const stats = [
    { value: 3.82, decimals: 1, suffix: '', label: t('stat_gpa') },
    { value: 7, decimals: 0, suffix: '', label: t('stat_cad') },
    { value: 2, decimals: 0, suffix: '', label: t('stat_internships') },
  ];

  return (
    <section id="propulsion" aria-label="Engineering Focus in CFD" className={`relative bg-bg-base ${SECTION_VISUAL === 'f1' ? 'overflow-x-clip z-10' : 'overflow-hidden'}`}>
      <div className="relative max-w-7xl mx-auto px-6 lg:pl-24 pt-16 lg:py-16">
        {/* Left: Text – stays in place */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-6 lg:max-w-[45%]"
        >
          {t('propulsion_label') && (
            <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-text-muted">
              {t('propulsion_label')}
            </p>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.08em] uppercase text-text-primary leading-tight">
            {t('propulsion_heading')}
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-text-secondary max-w-lg">
            {t('propulsion_body')}
          </p>

          {/* Stats below the paragraph text */}
          <div className="flex flex-wrap gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex-1 min-w-[80px] text-center bg-bg-card py-4 sm:py-5 rounded-sm border border-border-subtle">
                <CountUp
                  end={stat.value}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                  duration={2.2}
                />
                <p className="mt-1.5 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3D Viz – on large screens: positioned right and run out to the edge of the screen (the F1 car drives in from there), allowed to extend below; on small screens: below, full width */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-12 -mx-6 flex justify-center lg:absolute lg:top-8 lg:left-[45%] lg:right-[calc((100%-100vw)/2)] lg:mx-0 lg:mt-0"
        >
          {/* The F1 view fades out past this box, above and below, so it is not clipped here. */}
          <div className={`w-full h-[450px] md:h-[550px] lg:h-[700px] relative ${SECTION_VISUAL === 'f1' ? '' : 'overflow-hidden'}`}>
            {SECTION_VISUAL === 'f1' ? <F1CfdSimulation /> : <NozzleSimulation />}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PropulsionMetrics;
