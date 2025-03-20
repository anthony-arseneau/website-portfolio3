import './Links.css'
import { FaLinkedinIn } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import { FaRegFileAlt } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import React, { useEffect, useState } from 'react'

import resume from '../../assets/public_resume.pdf'

export const Links = () => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className={isVisible ? 'fade-up2 links' : 'links'}>
            <section className='links-container'>
                <ul className="links-menu">
                    <li className="links-menu-list-rotate">
                        <a href="https://linkedin.com/in/anthonyarseneau" target='_blank' className="links-menu-link"><FaLinkedinIn/></a>
                    </li>
                    <li className="links-menu-list-rotate">
                        <a href="https://github.com/anthony-arseneau" target='_blank' className="links-menu-link bigger"><FiGithub/></a>
                    </li>
                    <li className="links-menu-list">
                        <a id="pdfLink" href={resume} download={'resume_anthony_arseneau.pdf'} className="links-menu-link">Resume <FaRegFileAlt style={{marginTop: -2}}/></a>
                    </li>
                    <li className="links-menu-list-rotate">
                        <a onClick={() => window.location = 'mailto:afarseneau@mta.ca'} className="links-menu-link bigger"><LuSend style={{marginLeft: -1}}/></a>
                    </li>
                </ul>
            </section>
        </div>
    )
}

export default Links;