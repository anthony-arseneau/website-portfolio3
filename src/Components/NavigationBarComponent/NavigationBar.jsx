import React, { useEffect } from 'react'
import '../../../node_modules/bootstrap/dist/css/bootstrap.css' // Import bootstrap for styling
import './NavigationBar.css'
import videoBg from '../../assets/background4.mp4'

export const NavigationBar = () => {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 100; // Margin in pixels
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;
    
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      };
    return (
        <nav className="navbar">
            <section className="navbar-container">
                <ul className="menu">
                    <li className="menu-list">
                        <a onClick={() => scrollToSection('home')} className="menu-link">Home</a>
                    </li>
                    <li className="menu-list">
                        <a onClick={() => scrollToSection('experience1')} className="menu-link">Experience</a>
                    </li>
                </ul>
            </section>
        </nav>
    )
}

export default NavigationBar;