import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import engineImg from '../../assets/nozzle.jpeg';
import CountUp from '../HeroComponent/CountUp';

function PropulsionMetrics() {
  const { t } = useTranslation();

  const stats = [
    { value: 4.3, decimals: 1, suffix: ' / 4.3', label: t('stat_gpa') },
    { value: 5, decimals: 0, suffix: '+', label: t('stat_cad') },
    { value: 2, decimals: 0, suffix: '', label: t('stat_internships') },
  ];

  return (
    <section id="propulsion" className="relative bg-black py-20 sm:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="lg:w-1/2"
          >
            <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-gray-400 mb-3 sm:mb-4">
              {t('propulsion_label')}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.08em] uppercase text-white leading-tight mb-5 sm:mb-6">
              {t('propulsion_heading')}
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-gray-300 max-w-lg">
              {t('propulsion_body')}
            </p>
          </motion.div>

          {/* Right: Diagram + Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:w-1/2 relative"
          >
            {/* Engineering diagram — static engine image */}
            <div className="relative w-full aspect-[4/3] bg-[#060606] border border-white/[0.06] rounded-sm overflow-hidden">
              {/* Engine image */}
              <img
                src={engineImg}
                alt={t('propulsion_diagram_label')}
                className="absolute inset-0 w-full h-full object-contain opacity-90"
              />

              {/* Stats overlaid at bottom of diagram */}
              <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 px-4 sm:px-8">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center bg-black/60 backdrop-blur-sm py-2 sm:py-3 rounded-sm border border-white/[0.06]">
                      <CountUp
                        end={stat.value}
                        decimals={stat.decimals}
                        suffix={stat.suffix}
                        duration={2.2}
                      />
                      <p className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-gray-400">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default PropulsionMetrics;
