import React, { useState } from 'react';
import '../../../node_modules/bootstrap/dist/css/bootstrap.css'; // Import bootstrap for styling
import bash from '../../assets/bash.png';
import cloudflare from '../../assets/cloudflare.png';
import css from '../../assets/css.svg';
import js from '../../assets/js.png';
import jsx from '../../assets/jsx.png';
import react from '../../assets/react.png';
import ubuntu from '../../assets/ubuntu.png';
import './Experience.css';

import gradle from '../../assets/gradle.png';
import java from '../../assets/java.png';
import json from '../../assets/json.png';
import npm from '../../assets/npm.png';
import springboot from '../../assets/springboot.png';
import vite from '../../assets/vite.png';

import aes from '../../assets/aes.png';
import javafx from '../../assets/javafx.webp';
import rsa from '../../assets/rsa.png';
import sha256 from '../../assets/sha256.png';

import arduino from '../../assets/arduino.svg';
import cpp from '../../assets/cpp.png';
import dremel from '../../assets/dremel.jpg';
import fusion from '../../assets/fusion.png';


export const Experience = () => {
    const[display, setDisplay] = useState("projects");

    return (
        <>
            {/* Experience selection */}
            <div className='row'>
                <div className='col-md-4 offset-md-4'>
                    <div className='row selection'>
                        <div className="col-md-6 projects-selection">
                            {/* Projects */}
                            <input type="radio" id="projects" name="experience" value="projects" className="radio" onClick={() => setDisplay("projects")} defaultChecked/>
                            <label className="btn btn-secondary label label-1" htmlFor="projects">Projects</label>
                        </div>
                        <div className="col-md-6 education-selection">
                            {/* Education */}
                            <input type="radio" id="education" name="experience" value="education" className="radio" onClick={() => setDisplay("education")}/>
                            <label className="btn btn-secondary label label-2" htmlFor="education">Education</label>
                        </div>
                    </div>
                </div>
            </div>

            {display == "projects" &&
                <div className='row'>
                    <div className='col-md-8 offset-md-2 display'>
                        <div className="vl"/>
                        <ul className="list-component">
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">January 2024 – Present</h2>
                                    <h1 className="__title">Portfolio Website</h1>
                                    <div className='details'>
                                        <h3 className="__subtitle">Personal Project</h3>
                                        <p className="__text">
                                            Developed a responsive portfolio website hosted on a personal server to showcase projects, 
                                            skills, images, and videos, attracting over 600 unique users per month. Enhanced security and 
                                            performance with HTTPS integration, optimized media load times, and a seamless cross-device experience.
                                        </p>
                                    </div>
                                    <div className="tech-tags">
                                        <a href='https://vite.dev/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={vite}/>
                                                <span className='tech-name'>Vite</span>
                                            </div>
                                        </a>
                                        <a href='https://react.dev/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={react}/>
                                                <span className='tech-name'>React</span>
                                            </div>
                                        </a>
                                        <a href='https://legacy.reactjs.org/docs/introducing-jsx.html' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={jsx}/>
                                                <span className='tech-name'>JavaScript XML</span>
                                            </div>
                                        </a>
                                        <a href='https://www.javascript.com/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={js}/>
                                                <span className='tech-name'>JavaScript</span>
                                            </div>
                                        </a>
                                        <a href='https://developer.mozilla.org/en-US/docs/Web/CSS' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={css}/>
                                                <span className='tech-name'>CSS</span>
                                            </div>
                                        </a>
                                        <a href='https://www.cloudflare.com/en-ca/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={cloudflare}/>
                                                <span className='tech-name'>Cloudflare</span>
                                            </div>
                                        </a>
                                        <a href='https://mywiki.wooledge.org/BashGuide' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={bash}/>
                                                <span className='tech-name'>Bash Scripting</span>
                                            </div>
                                        </a>
                                        <a href='https://design.ubuntu.com/brand' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={ubuntu}/>
                                                <span className='tech-name'>Ubuntu Server</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </li>
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">September - December 2024</h2>
                                    <h1 className="__title">Sight Reading Application</h1>
                                    <div className='details'>
                                        <h3 className="__subtitle">University Project - Software Design</h3>
                                        <p className="__text">
                                            Developed a responsive portfolio website hosted on a personal server to showcase projects, 
                                            skills, images, and videos, attracting over 600 unique users per month. Enhanced security and 
                                            performance with HTTPS integration, optimized media load times, and a seamless cross-device experience.
                                        </p>
                                    </div>
                                    <div className="tech-tags">
                                        <a href='https://spring.io/projects/spring-boot' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={springboot}/>
                                                <span className='tech-name'>Spring Boot</span>
                                            </div>
                                        </a>
                                        <a href='https://gradle.org/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={gradle}/>
                                                <span className='tech-name'>Gradle</span>
                                            </div>
                                        </a>
                                        <a href='https://www.java.com/en/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={java}/>
                                                <span className='tech-name'>Java</span>
                                            </div>
                                        </a>
                                        <a href='https://www.json.org/json-en.html' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={json}/>
                                                <span className='tech-name'>JSON</span>
                                            </div>
                                        </a>
                                        <a href='https://vite.dev/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={vite}/>
                                                <span className='tech-name'>Vite</span>
                                            </div>
                                        </a>
                                        <a href='https://react.dev/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={react}/>
                                                <span className='tech-name'>React</span>
                                            </div>
                                        </a>
                                        <a href='https://legacy.reactjs.org/docs/introducing-jsx.html' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={jsx}/>
                                                <span className='tech-name'>JavaScript XML</span>
                                            </div>
                                        </a>
                                        <a href='https://www.javascript.com/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={js}/>
                                                <span className='tech-name'>JavaScript</span>
                                            </div>
                                        </a>
                                        <a href='https://www.npmjs.com/' target='_blank'>
                                            <div className='tech-tag' style={{paddingLeft: '12px', paddingBottom: '5px'}}>
                                                <img className='tech-logo' src={npm}/>
                                                <span className='tech-name'>npm</span>
                                            </div>
                                        </a>
                                        <a href='https://developer.mozilla.org/en-US/docs/Web/CSS' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={css}/>
                                                <span className='tech-name'>CSS</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </li>
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">January - April 2024</h2>
                                    <h1 className="__title">Encrypted Messaging Application</h1>
                                    <div className='details'>
                                        <h3 className="__subtitle">University Project, Computer Networks</h3>
                                        <p className="__text">
                                        Developed a secure messaging application using cryptographic algorithms like RSA, AES, and SHA-256, ensuring 
                                        data integrity and confidentiality. Built with Java and Computer Networks frameworks, the project was 
                                        rigorously tested for resilience against network vulnerabilities.
                                        </p>
                                    </div>
                                    <div className="tech-tags">
                                        <a href='https://openjfx.io/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={javafx}/>
                                                <span className='tech-name'>JavaFX</span>
                                            </div>
                                        </a>
                                        <a href='https://www.java.com/en/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={java}/>
                                                <span className='tech-name'>Java</span>
                                            </div>
                                        </a>
                                        <a href='https://www.devglan.com/online-tools/rsa-encryption-decryption' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' style={{ height: '80%', marginTop: '2%'}} src={rsa}/>
                                                <span className='tech-name'>RSA</span>
                                            </div>
                                        </a>
                                        <a href='https://www.devglan.com/online-tools/aes-encryption-decryption' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={aes}/>
                                                <span className='tech-name'>AES</span>
                                            </div>
                                        </a>
                                        <a href='https://www.devglan.com/online-tools/hmac-sha256-online' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={sha256}/>
                                                <span className='tech-name'>SHA-256</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </li>
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">September - December 2023</h2>
                                    <h1 className="__title">Self-Leveling Robot</h1>
                                    <div className='details'>
                                        <h3 className="__subtitle">Mount Allison University</h3>
                                        <p className="__text"></p>
                                    </div>
                                    <div className="tech-tags">
                                        <a href='https://cplusplus.com/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={cpp}/>
                                                <span className='tech-name'>C++</span>
                                            </div>
                                        </a>
                                        <a href='https://www.arduino.cc/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo' src={arduino}/>
                                                <span className='tech-name'>Arduino</span>
                                            </div>
                                        </a>
                                        <a href='https://www.autodesk.com/ca-en/products/fusion-360/personal' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={fusion}/>
                                                <span className='tech-name'>Fusion 360 CAD</span>
                                            </div>
                                        </a>
                                        <a href='https://www.dremel.com/gn/en/digilab' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={dremel}/>
                                                <span className='tech-name'>3D Printing</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            }

            {display == "education" &&
                <div className='row'>
                    <div className='col-md-8 offset-md-2 display'>
                        <div className="vl"/>
                        <ul className="list-component">
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">2025 - 2027</h2>
                                    <h1 className="__title">MEng. Mecanical Engineering</h1>
                                    <div className='details'>
                                        <h3 className="__subtitle">Applying...</h3>
                                        <p className="__text"></p>
                                    </div>
                                </div>
                            </li>
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">2021 - 2025</h2>
                                    <h1 className="__title">BSc. Major in Computer Science, Minor in Mathematics</h1>
                                    <div className='details'>
                                        <h3 className="__subtitle">Mount Allison University</h3>
                                        <p className="__text"></p>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            }
        </>
    )
}

export default Experience