import './Links.css'
import { FaLinkedinIn } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import { FaRegFileAlt } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import React, { useEffect, useState } from 'react'

import resume from '../../assets/public_resume.pdf'

export const Links = () => {
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
    
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleResumeClick = (e) => {
        e.preventDefault(); // Prevent default anchor behavior
    
        // Open in new tab
        window.open(resume, '_blank');
    
        // Trigger download
        const link = document.createElement('a');
        link.href = resume;
        link.download = 'resume_anthony_arseneau.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className={isVisible ? 'fade-up2 links' : 'links'}>
                <section className='links-container'>
                    <ul className="links-menu">
                        <li className="links-menu-list-rotate">
                            <a href="https://linkedin.com/in/anthonyarseneau" 
                            target='_blank' className="links-menu-link" 
                            onMouseMove={(e) => handleMouseMove(e, 'LinkedIn')}
                            onMouseLeave={handleMouseLeave}>
                                <FaLinkedinIn/>
                            </a>
                        </li>
                        <li className="links-menu-list-rotate">
                            <a href="https://github.com/anthony-arseneau" 
                            target='_blank' 
                            className="links-menu-link bigger"
                            onMouseMove={(e) => handleMouseMove(e, 'GitHub')}
                            onMouseLeave={handleMouseLeave}>
                                <FiGithub/>
                            </a>
                        </li>
                        <li className="links-menu-list">
                            <a
                                id="pdfLink"
                                href={resume}
                                className="links-menu-link"
                                onClick={handleResumeClick}
                                onMouseMove={(e) => handleMouseMove(e, 'Download Resume')}
                                onMouseLeave={handleMouseLeave}
                            >
                                Resume <FaRegFileAlt style={{ marginTop: -2 }} />
                            </a>
                        </li>
                        <li className="links-menu-list-rotate">
                            <a onClick={() => window.location = 'mailto:afarseneau@mta.ca'} 
                            className="links-menu-link bigger"
                            onMouseMove={(e) => handleMouseMove(e, 'Email me')}
                            onMouseLeave={handleMouseLeave}>
                                <LuSend style={{marginLeft: -1}}/>
                            </a>
                        </li>
                    </ul>
                </section>
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
                        maxWidth: '400px',  
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
        </>
    )
}

export default Links;