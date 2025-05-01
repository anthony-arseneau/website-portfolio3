import React from 'react';
import {
  vite, react, jsx, js, css, cloudflare, bash, ubuntu, npm, springboot,
  gradle, java, json, figma, scrum, javafx, rsa, aes, sha256, cpp,
  arduino, fusion, dremel, html, googlestreet
} from '../../assets/logos_import';
import './TechStack.css'

const techStacks = {
  'Web Development & Front-End': [
    { name: 'HTML', url: 'https://www.w3schools.com/howto/howto_make_a_website.asp', logo: html },
    { name: 'CSS', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', logo: css },
    { name: 'JavaScript', url: 'https://www.javascript.com/', logo: js },
    { name: 'JSX', url: 'https://legacy.reactjs.org/docs/introducing-jsx.html', logo: jsx },
    { name: 'React', url: 'https://react.dev/', logo: react },
    { name: 'Vite', url: 'https://vite.dev/', logo: vite },
    { name: 'npm', url: 'https://www.npmjs.com/', logo: npm },
    { name: 'Figma', url: 'https://www.figma.com/', logo: figma }
  ],
  'Software Engineering & Back-End': [
    { name: 'Java', url: 'https://www.java.com/en/', logo: java },
    { name: 'JavaFX', url: 'https://openjfx.io/', logo: javafx },
    { name: 'Spring Boot', url: 'https://spring.io/projects/spring-boot', logo: springboot },
    { name: 'Gradle', url: 'https://gradle.org/', logo: gradle },
    { name: 'JSON', url: 'https://www.json.org/json-en.html', logo: json },
    { name: 'Scrum', url: 'https://www.scrum.org/', logo: scrum }
  ],
  'Systems & Engineering Tools': [
    { name: 'C++', url: 'https://cplusplus.com/', logo: cpp },
    { name: 'Arduino', url: 'https://www.arduino.cc/', logo: arduino },
    { name: 'Fusion 360', url: 'https://www.autodesk.com/ca-en/products/fusion-360/personal', logo: fusion },
    { name: '3D Printing', url: 'https://www.dremel.com/gn/en/digilab', logo: dremel },
    { name: 'RSA', url: 'https://www.devglan.com/online-tools/rsa-encryption-decryption', logo: rsa },
    { name: 'AES', url: 'https://www.devglan.com/online-tools/aes-encryption-decryption', logo: aes },
    { name: 'SHA-256', url: 'https://www.devglan.com/online-tools/hmac-sha256-online', logo: sha256 },
    { name: 'Bash', url: 'https://mywiki.wooledge.org/BashGuide', logo: bash },
    { name: 'Ubuntu Server', url: 'https://design.ubuntu.com/brand', logo: ubuntu },
    { name: 'Cloudflare', url: 'https://www.cloudflare.com/en-ca/', logo: cloudflare },
    { name: 'Google Street View', url: 'https://www.google.com/streetview/', logo: googlestreet }
  ]
};

const TechStack = () => (
    <div className='row'>
        <div className="col-md-8 offset-md-2 tech-stack-container display">
            <h1 className='header'>Tech Stack</h1>
            <div className='row justify-content-center'>
                {Object.entries(techStacks).map(([category, tools]) => (
                <div key={category} className="tech-column">
                    <h3 className='category'>{category}</h3>
                    <div className="tech-tags">
                    {tools.map(({ name, url, logo }) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={name}>
                        <div className="tech-tag2">
                            <img className="tech-logo corner" src={logo} alt={name} />
                            <span className="tech-name">{name}</span>
                        </div>
                        </a>
                    ))}
                    </div>
                </div>
                ))}
            </div>
        </div>
    </div>
);

export default TechStack;
