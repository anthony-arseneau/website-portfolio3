import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './NavigationBar.css';
import '../../../node_modules/bootstrap/dist/css/bootstrap.css';

export const NavigationBar = () => {
    const { t, i18n } = useTranslation();
    const [language, setLanguage] = useState('EN');

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
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

    const toggleLanguage = () => {
        const newLang = language === 'EN' ? 'FR' : 'EN';
        setLanguage(newLang);
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="nav-wrapper">
            <nav className="navbar">
                <section className="navbar-container">
                    <ul className="menu">
                        <li className="menu-list">
                            <a onClick={() => scrollToSection('home')} className="menu-link">{t('home')}</a>
                        </li>
                        <li className="menu-list">
                            <a onClick={() => scrollToSection('experience1')} className="menu-link">{t('experience_')}</a>
                        </li>
                        <li className="menu-list">
                            <a onClick={() => scrollToSection('tech-stack')} className="menu-link">{t('tech-stack')}</a>
                        </li>
                    </ul>
                </section>
            </nav>
            <div className="language-toggle">
                <button className="lang-btn" onClick={toggleLanguage}>
                    {language === 'EN' ? 'FR' : 'EN'}
                </button>
            </div>
        </div>
    );
};

export default NavigationBar;
