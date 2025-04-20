import './Hero.css'
import profile from '../../assets/profile4.png'
import canadaFlag from '../../assets/canada_flag.png'
import videoBg from '../../assets/background4.mp4'
import { Links } from '../../Components/component_import.js'
import React, { useEffect, useState } from 'react'
import worker from '../../assets/worker.png'
import computer from '../../assets/cpu.png'

function Hero() {
    const [isVisible, setIsVisible] = useState(false);
    const [showTextarea, setShowTextarea] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hoverText, setHoverText] = useState('');

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleMouseMove = (e, text) => {
        setShowTextarea(true);
        setHoverText(text);
        setPosition({ x: e.pageX + 15, y: e.pageY + 15 });
    };

    const handleMouseLeave = () => {
        setShowTextarea(false);
    };

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
                        <a target='_blank' className='info-location' href='https://www.google.com/maps/place/Fredericton,+NB/...'>
                            <h3>Fredericton NB, Canada<img className='flag' src={canadaFlag} /></h3>
                        </a>
                    </div>
                </div>
                <div className='row'>
                    <h1 className={isVisible ? 'fade-up hero-title col-md-8 offset-md-2' : 'hero-title col-md-8 offset-md-2'}>
                        MEng. ME Student 
                        <img 
                            src={worker} 
                            alt="worker icon" 
                            className="icon" 
                            onMouseMove={(e) => handleMouseMove(e, 'Mechanical Engineering Grad Student')}
                            onMouseLeave={handleMouseLeave}
                        /> 
                        <br /> 
                        & BSc. CS 
                        <img 
                            src={computer} 
                            alt="computer icon" 
                            className="icon" 
                            onMouseMove={(e) => handleMouseMove(e, 'Bachelor of Science with a Major in Computer Science and a Minor in Mathematics')}
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
                            padding: '4px 8px',
                            color: 'white',
                            fontSize: '12px',
                            width: 'auto', // Allow container to shrink with content
                            maxWidth: '376px',  
                            minWidth: '50px',  // Prevent it from being too narrow
                            display: 'inline-block',
                            whiteSpace: 'pre-wrap',  // Preserve spaces and line breaks
                            wordBreak: 'break-word',  // Ensure long words wrap
                            zIndex: 1000,
                            textAlign: 'left',
                            fontWeight: 'bold',
                            overflowWrap: 'break-word',  // Ensure words break properly
                            backdropFilter: 'blur(3px)',  // Apply blur effect to the background
                            boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.4)',
                        }}
                    >
                        {hoverText}
                    </div>
                )}


                <Links/>
            </div>
        </>
    )
}

export default Hero;
