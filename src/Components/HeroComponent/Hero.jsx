import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import { useHoverText } from '../../hooks/useHoverText'; // Import the custom hook
import './Hero.css';
import profile from '../../assets/profile5.png';
import canadaFlag from '../../assets/canada_flag.png';
import videoBg from '../../assets/background4.mp4';
import { Links } from '../../Components/component_import.js';
import worker from '../../assets/worker.png';
import computer from '../../assets/cpu.png';
import firework from '../../assets/fireworks.gif';

function Hero() {
    const [isVisible, setIsVisible] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [gifKey, setGifKey] = useState(0);

    const { t } = useTranslation(); 
    const { showTextarea, position, hoverText, handleMouseMove, handleMouseLeave } = useHoverText(); // Using custom hook

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <>
            <div className='hero' id='home'>
                <div className='video-wrapper'>
                    <video src={videoBg} autoPlay loop muted className='video-bg'/>
                </div>
                <div className="video-overlay"/>
                <div className={isVisible ? 'fade-down profile-info' : 'profile-info'}>
                    <div className='profile-container'>
                        <img src={profile} className="profile" alt="AI generated profile picture. See Linkedin or github profiles to see actual picture." />
                    </div>
                    <div className='info'>
                        <h2>Anthony Arseneau</h2>
                        <a 
                            target='_blank' 
                            className='info-location' 
                            href='https://www.google.com/maps/place/Fredericton,+NB/...'
                            onMouseEnter={() => {
                                setHovering(true);
                                setGifKey(prev => prev + 1);
                            }}
                            onMouseLeave={() => {
                                setHovering(false);
                                handleMouseLeave();
                            }}
                            onMouseMove={(e) => handleMouseMove(e, t('locationDescription'))}
                        >
                            <h3>{t('location')}
                                <span className='flag-wrapper'>
                                    <img className='flag' src={canadaFlag} />
                                    
                                    {hovering && false && (
                                        <>
                                            <img className='flag-anim flag-anim-left' src={`${firework}?${gifKey}`} alt="animated fireworks" />
                                            <img className='flag-anim flag-anim-right' src={`${firework}?${gifKey}`} alt="animated fireworks" />
                                        </>
                                    )}
                                </span>
                            </h3>
                        </a>
                    </div>
                </div>
                <div className='row'>
                    <h1 className={isVisible ? 'fade-up hero-title col-md-8 offset-md-2' : 'hero-title col-md-8 offset-md-2'}>
                        {t('studentTitle')} 
                        <img 
                            src={worker} 
                            alt="worker icon" 
                            className="icon" 
                            onMouseMove={(e) => handleMouseMove(e, t('engineeringDegree'))}
                            onMouseLeave={handleMouseLeave}
                        /> 
                        <br /> 
                        {t('degreeTitle')} 
                        <img 
                            src={computer} 
                            alt="computer icon" 
                            className="icon" 
                            onMouseMove={(e) => handleMouseMove(e, t('computerScienceDegree'))}
                            onMouseLeave={handleMouseLeave}
                        />
                    </h1>
                </div>

                {showTextarea && (
                    <div
                        className="floating-textarea"
                        style={{
                            position: 'absolute',
                            top: position.y,
                            left: position.x,
                            background: 'linear-gradient(135deg, rgba(46, 49, 146, 0.8), rgba(23, 209, 209, 0.5))',
                            borderRadius: '8px',
                            padding: '5px 8px',
                            color: 'white',
                            fontSize: '12px',
                            width: 'auto',
                            maxWidth: '376px',  
                            minWidth: '50px',
                            display: 'inline-block',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            zIndex: 1000,
                            textAlign: 'left',
                            fontWeight: 'bold',
                            overflowWrap: 'break-word',
                            backdropFilter: 'blur(3px)',
                            boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.4)',
                            lineHeight: '1.3',
                        }}
                    >
                        {hoverText}
                    </div>
                )}

                <Links/>
            </div>
        </>
    );
}

export default Hero;
