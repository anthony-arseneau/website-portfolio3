import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  arduino,
  autocad,
  bash,
  cloudflare,
  cpp,
  dremel,
  fusion,
  gradle, java, javafx,
  js,
  json,
  jsx,
  kicad,
  matlab,
  mysql,
  npm,
  python,
  react,
  sim20,
  solidworks,
  springboot,
  typescript,
  ubuntu,
  vite,
  linux
} from '../../assets/logos_import';

const TechStack = () => {
  const { t, i18n } = useTranslation();

  const cadEngineering = [
    // { name: 'CATIA', url: 'https://www.3ds.com/products-services/catia/', logo: null, placeholder: 'CATIA' },
    // { name: 'ANSYS', url: 'https://www.ansys.com/', logo: null, placeholder: 'ANSYS' },
    
    { name: 'SolidWorks', url: 'https://www.solidworks.com/', logo: solidworks, },
    { name: 'MATLAB & Simulink', url: 'https://www.mathworks.com/products/matlab.html', logo: matlab },
    { name: '20-sim', url: 'https://www.20sim.com/', logo: sim20, },
    { name: 'Arduino', url: 'https://www.arduino.cc/', logo: arduino },
    { name: 'KiCad', url: 'https://www.kicad.org/', logo: kicad },
    { name: 'AutoCAD', url: 'https://www.autodesk.com/products/autocad/overview', logo: autocad, },
    { name: 'Fusion 360', url: 'https://www.autodesk.com/ca-en/products/fusion-360/personal', logo: fusion },
    { name: '3D Printing', url: 'https://www.dremel.com/gn/en/digilab', logo: dremel },
  ];

  const software = [
    { name: 'Python', url: 'https://www.python.org/', logo: python },
    { name: 'C++', url: 'https://cplusplus.com/', logo: cpp },
    { name: 'Java', url: 'https://www.java.com/en/', logo: java },
    { name: 'JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', logo: js },
    { name: 'TypeScript', url: 'https://www.typescriptlang.org/', logo: typescript },
    { name: 'React', url: 'https://react.dev/', logo: react },
    { name: 'Vite', url: 'https://vite.dev/', logo: vite },
    { name: 'Linux', url: 'https://www.linux.org/', logo: linux },
    { name: 'Ubuntu', url: 'https://design.ubuntu.com/brand', logo: ubuntu },
    { name: 'Bash', url: 'https://mywiki.wooledge.org/BashGuide', logo: bash, invertOnLight: true },
    { name: 'Spring Boot', url: 'https://spring.io/projects/spring-boot', logo: springboot },
    { name: 'Gradle', url: 'https://gradle.org/', logo: gradle, invertOnLight: true },
    { name: 'Cloudflare', url: 'https://www.cloudflare.com/', logo: cloudflare },
    { name: 'npm', url: 'https://www.npmjs.com/', logo: npm },
    { name: 'MySQL', url: 'https://www.mysql.com/', logo: mysql, placeholder: 'SQL' },
    { name: 'JSON', url: 'https://www.json.org/json-en.html', logo: json },
    { name: 'JavaScript XML', url: 'https://legacy.reactjs.org/docs/introducing-jsx.html', logo: jsx },
    { name: 'JavaFX', url: 'https://openjfx.io/', logo: javafx },
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
        bg-bg-card border border-border-subtle
        hover:border-border-default hover:bg-bg-elevated
        transition-all duration-300 cursor-pointer
        ${large ? 'p-5 sm:p-7' : 'p-4 sm:p-5'}
      `}
    >
      <div className={`flex items-center justify-center mb-2 sm:mb-3 transition-all duration-300 ${large ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-9 h-9 sm:w-11 sm:h-11'}`}>
        {item.logo ? (
          <img src={item.logo} alt={item.name} className={`max-w-full max-h-full object-contain ${item.invertOnLight ? 'theme-dark-on-light' : ''}`} />
        ) : (
          <span className={`font-bold text-text-secondary group-hover:text-text-primary tracking-wider ${large ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>
            {item.placeholder}
          </span>
        )}
      </div>
      <span className={`text-text-secondary group-hover:text-text-primary transition-colors duration-300 tracking-wider ${large ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>
        {item.name}
      </span>
    </motion.a>
  );

  return (
    <section id="tech-stack" className="pt-10 sm:pt-14 pb-20 sm:pb-28 px-4 sm:px-6 bg-bg-base">
      <div className="max-w-5xl mx-auto">
        <motion.div
          key={`title-${i18n.language}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 sm:mb-18"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.12em] uppercase text-text-primary">
            {t('tech-stack-title')}
          </h2>
          <div className="h-px w-12 bg-text-primary/55 mx-auto mt-4 sm:mt-5" />
        </motion.div>

        {/* CAD & Engineering — larger, highlighted first */}
        <div className="mb-14 sm:mb-18">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm tracking-[0.35em] text-text-secondary mb-6 sm:mb-8 text-center"
          >
            {t('tech_cad_title')}
          </motion.h3>
          <motion.div
            key={`cad-${i18n.language}`}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2.5 sm:gap-3"
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
            className="text-xs sm:text-sm tracking-[0.35em] text-text-secondary mb-6 sm:mb-8 text-center"
          >
            {t('tech_software_title')}
          </motion.h3>
          <motion.div
            key={`sw-${i18n.language}`}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2.5 sm:gap-3"
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
