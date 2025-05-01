import React, { useEffect, useState } from 'react';
import { useHoverText } from '../../hooks/useHoverText';
import { useTranslation } from 'react-i18next'; // Import the useTranslation hook
import './Links.css';
import { FaLinkedinIn } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import { FaRegFileAlt } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import resume from '../../assets/public_resume.pdf';

export const Links = () => {
    const { t } = useTranslation(); // Hook for translation
    const [isVisible, setIsVisible] = useState(false);
    const { showTextarea, position, hoverText, handleMouseMove, handleMouseLeave } = useHoverText();

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
                            onMouseMove={(e) => handleMouseMove(e, t('hoverLinkedIn'))}
                            onMouseLeave={handleMouseLeave}>
                                <FaLinkedinIn/>
                            </a>
                        </li>
                        <li className="links-menu-list-rotate">
                            <a href="https://github.com/anthony-arseneau" 
                            target='_blank' 
                            className="links-menu-link bigger"
                            onMouseMove={(e) => handleMouseMove(e, t('hoverGitHub'))}
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
                                onMouseMove={(e) => handleMouseMove(e, t('hoverDownloadResume'))}
                                onMouseLeave={handleMouseLeave}
                            >
                                {t('resume')} <FaRegFileAlt style={{ marginTop: -2 }} />
                            </a>
                        </li>
                        <li className="links-menu-list-rotate">
                            <a onClick={() => window.location = 'mailto:afarseneau@mta.ca'} 
                            className="links-menu-link bigger"
                            onMouseMove={(e) => handleMouseMove(e, t('hoverEmailMe'))}
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
                        padding: '5px 8px',
                        color: 'white',
                        fontSize: '12px',
                        width: 'auto',
                        maxWidth: '400px',  
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
        </>
    );
}

export default Links;
