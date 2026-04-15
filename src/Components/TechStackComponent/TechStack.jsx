import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    arduino,
    bash,
    cpp,
    dremel,
    fusion,
    gradle, java, javafx,
    react,
    springboot,
    ubuntu,
    vite
} from '../../assets/logos_import';

const TechStack = () => {
  const { t } = useTranslation();

  const cadEngineering = [
    { name: 'CATIA', url: 'https://www.3ds.com/products-services/catia/', logo: null, placeholder: 'CATIA' },
    { name: 'ANSYS', url: 'https://www.ansys.com/', logo: null, placeholder: 'ANSYS' },
    { name: 'MATLAB & Simulink', url: 'https://www.mathworks.com/products/matlab.html', logo: null, placeholder: 'MATLAB' },
    { name: 'Fusion 360', url: 'https://www.autodesk.com/ca-en/products/fusion-360/personal', logo: fusion },
    { name: 'AutoCAD', url: 'https://www.autodesk.com/products/autocad/overview', logo: null, placeholder: 'AutoCAD' },
    { name: 'Arduino', url: 'https://www.arduino.cc/', logo: arduino },
    { name: '3D Printing', url: 'https://www.dremel.com/gn/en/digilab', logo: dremel },
  ];

  const software = [
    { name: 'C++', url: 'https://cplusplus.com/', logo: cpp },
    { name: 'SQL', url: 'https://www.w3schools.com/sql/', logo: null, placeholder: 'SQL' },
    { name: 'Java', url: 'https://www.java.com/en/', logo: java },
    { name: 'React', url: 'https://react.dev/', logo: react },
    { name: 'Bash', url: 'https://mywiki.wooledge.org/BashGuide', logo: bash },
    { name: 'Ubuntu Server', url: 'https://design.ubuntu.com/brand', logo: ubuntu },
    { name: 'Spring Boot', url: 'https://spring.io/projects/spring-boot', logo: springboot },
    { name: 'JavaFX', url: 'https://openjfx.io/', logo: javafx },
    { name: 'Vite', url: 'https://vite.dev/', logo: vite },
    { name: 'Gradle', url: 'https://gradle.org/', logo: gradle },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const TechItem = ({ item, large = false }) => (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      variants={itemVariants}
      className={`
        group flex flex-col items-center justify-center rounded-sm
        bg-[#080808] border border-white/[0.05]
        hover:border-white/20 hover:bg-[#0e0e0e]
        transition-all duration-300 cursor-pointer
        ${large ? 'p-5 sm:p-7' : 'p-4 sm:p-5'}
      `}
    >
      <div className={`flex items-center justify-center mb-2 sm:mb-3 grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100 ${large ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-9 h-9 sm:w-11 sm:h-11'}`}>
        {item.logo ? (
          <img src={item.logo} alt={item.name} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className={`font-bold text-gray-400 group-hover:text-white uppercase tracking-wider ${large ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>
            {item.placeholder}
          </span>
        )}
      </div>
      <span className={`text-gray-400 group-hover:text-white transition-colors duration-300 tracking-wider uppercase ${large ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>
        {item.name}
      </span>
    </motion.a>
  );

  return (
    <section id="tech-stack" className="py-20 sm:py-28 px-4 sm:px-6 bg-black">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 sm:mb-18"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.12em] uppercase text-white">
            {t('tech-stack-title')}
          </h2>
          <div className="h-px w-12 bg-white/15 mx-auto mt-4 sm:mt-5" />
        </motion.div>

        {/* CAD & Engineering — larger, highlighted first */}
        <div className="mb-14 sm:mb-18">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm uppercase tracking-[0.35em] text-gray-400 mb-6 sm:mb-8 text-center"
          >
            {t('tech_cad_title')}
          </motion.h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3"
          >
            {cadEngineering.map((item) => (
              <TechItem key={item.name} item={item} large />
            ))}
          </motion.div>
        </div>

        {/* Software & Programming */}
        <div>
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm uppercase tracking-[0.35em] text-gray-400 mb-6 sm:mb-8 text-center"
          >
            {t('tech_software_title')}
          </motion.h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3"
          >
            {software.map((item) => (
              <TechItem key={item.name} item={item} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;
