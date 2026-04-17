import Experience from '../../Components/ExperienceComponent/Experience.jsx';
import Footer from '../../Components/FooterComponent/Footer.jsx';
import Hero from '../../Components/HeroComponent/Hero.jsx';
import Institutions from '../../Components/InstitutionsComponent/Institutions.jsx';
import NavigationBar from '../../Components/NavigationBarComponent/NavigationBar.jsx';
import PropulsionMetrics from '../../Components/PropulsionComponent/PropulsionMetrics.jsx';
import TechStack from '../../Components/TechStackComponent/TechStack.jsx';

function Home() {
  return (
    <div className="min-h-screen bg-bg-base">
      <NavigationBar />
      <Hero />
      <PropulsionMetrics />
      <Experience />
      <TechStack />
      <Institutions />
      <Footer />
    </div>
  );
}

export default Home;
