import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHoverText } from '../../hooks/useHoverText';
import './Hero.css'; // Make sure to update Hero.css
import profile from '../../assets/profile.jpg';
import canadaFlag from '../../assets/canada_flag.png';
import videoBg from '../../assets/background4.mp4';
import { Links } from '../../Components/component_import.js';
import worker from '../../assets/worker.png';
import computer from '../../assets/cpu.png';
// import firework from '../../assets/fireworks.gif'; // Kept for reference, but not used in the flag hover anymore

function Hero() {
    const [isVisible, setIsVisible] = useState(false);
    // const [hovering, setHovering] = useState(false); // No longer needed for fireworks
    // const [gifKey, setGifKey] = useState(0); // No longer needed for fireworks

    const { t } = useTranslation();
    const { showTextarea, position, hoverText, handleMouseMove, handleMouseLeave } = useHoverText();

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Simplified location hover, fireworks removed as they might conflict visually
    // with the new diamond overlay or become too busy.
    // If you still want them, you'll need to manage the 'hovering' state again.
    const handleLocationMouseEnter = (e) => {
        handleMouseMove(e, t('locationDescription'));
        // setHovering(true);
        // setGifKey(prev => prev + 1);
    };

    const handleLocationMouseLeave = () => {
        handleMouseLeave();
        // setHovering(false);
    };

    return (
        <>
            <div className='hero' id='home'>
                <div className='video-wrapper'>
                    <video src={videoBg} autoPlay loop muted className='video-bg'/>
                </div>
                <div className="video-overlay"/>

                <div className={isVisible ? 'fade-down profile-info hero-content' : 'profile-info hero-content'}>
                    <div className='profile-container'>
                        <div className="neon-ring">
                        <img src={profile} className="profile" alt="profile picture. See Linkedin or github profiles to see actual picture." />
                        </div>
                    </div>
                    <div className='info'>
                        <h2>Anthony Arseneau</h2>
                        <a
                            target='_blank'
                            rel="noopener noreferrer" // Good practice for target='_blank'
                            className='info-location'
                            href='https://www.google.com/maps/place/Fredericton,+NB/' // Removed ellipsis, ensure link is valid
                            onMouseEnter={handleLocationMouseEnter}
                            onMouseLeave={handleLocationMouseLeave}
                            // onMouseMove is already handled by useHoverText for the text part
                            // For the location text specifically, we passed it in onMouseEnter
                        >
                            <h3>{t('location')}
                                <span className='flag-wrapper'>
                                    <img className='flag' src={canadaFlag} alt="Canadian Flag"/>
                                    {/* Fireworks animation removed for now for clarity with new overlay
                                    {hovering && false && ( // This was always false, perhaps a typo?
                                        <>
                                            <img className='flag-anim flag-anim-left' src={`${firework}?${gifKey}`} alt="animated fireworks" />
                                            <img className='flag-anim flag-anim-right' src={`${firework}?${gifKey}`} alt="animated fireworks" />
                                        </>
                                    )}
                                    */}
                                </span>
                            </h3>
                        </a>
                    </div>
                </div>
                <div className='row hero-content'>
                    <h1 className={isVisible ? 'fade-up hero-title col-md-8 offset-md-2' : 'hero-title col-md-8 offset-md-2'}>
                        {t('studentTitle')}
                        {/* <img
                            src={worker}
                            alt="worker icon"
                            className="icon"
                            onMouseMove={(e) => handleMouseMove(e, t('engineeringDegree'))}
                            onMouseLeave={handleMouseLeave}
                        /> */}
                        {/* <br />
                        {t('degreeTitle')}
                        <img
                            src={computer}
                            alt="computer icon"
                            className="icon"
                            onMouseMove={(e) => handleMouseMove(e, t('computerScienceDegree'))}
                            onMouseLeave={handleMouseLeave}
                        /> */}
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
                            zIndex: 1000, // Ensure this is above the diamond overlay
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
                {/* Ensure Links component also has a higher z-index if needed */}
                <div className="hero-content" style={{width: '100%' /* Ensure it takes space for centering Links */}}>
                  <Links/>
                </div>
            </div>
        </>
    );
}

export default Hero;