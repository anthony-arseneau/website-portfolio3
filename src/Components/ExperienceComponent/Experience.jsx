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
import { useTranslation } from 'react-i18next'; 

import gradle from '../../assets/gradle.png';
import java from '../../assets/java.png';
import json from '../../assets/json.png';
import npm from '../../assets/npm.png';
import springboot from '../../assets/springboot.png';
import vite from '../../assets/vite.png';
import figma from '../../assets/figma.png'
import scrum from '../../assets/scrum.png'

import aes from '../../assets/aes.png';
import javafx from '../../assets/javafx.webp';
import rsa from '../../assets/rsa.png';
import sha256 from '../../assets/sha256.png';

import arduino from '../../assets/arduino.svg';
import cpp from '../../assets/cpp.png';
import dremel from '../../assets/dremel.jpg';
import fusion from '../../assets/fusion.png';

import baller from '../../assets/baller2.mp4'
import SPGC from '../../assets/SPGC.jpg'
import knowinnotes from '../../assets/knowinnotes.png'

import html from '../../assets/html.webp'

import googlestreet from '../../assets/googlestreet.png'


export const Experience = () => {
    const[display, setDisplay] = useState("experience");
    const { t } = useTranslation(); 

    return (
        <>
            {/* Experience selection */}
            <div className='row' id='experience1'>
                <div className='col-md-4 offset-md-4'>
                    <div className='row selection'>
                        <div className="col-md-4 projects-selection">
                            {/* Projects */}
                            <input type="radio" id="projects" name="experience" value="projects" className="radio" onClick={() => setDisplay("projects")}/>
                            <label className="btn btn-secondary label label-1" htmlFor="projects">{t('experience.selection.projects')}</label>
                        </div>
                        <div className="col-md-4 experience-selection">
                            {/* Experience */}
                            <input type="radio" id="experience" name="experience" value="experience" className="radio" onClick={() => setDisplay("experience")} defaultChecked/>
                            <label className="btn btn-secondary label label-2" htmlFor="experience">{t('experience.selection.work')}</label>
                        </div>
                        <div className="col-md-4 education-selection">
                            {/* Education */}
                            <input type="radio" id="education" name="experience" value="education" className="radio" onClick={() => setDisplay("education")}/>
                            <label className="btn btn-secondary label label-3" htmlFor="education">{t('experience.selection.education')}</label>
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
                                    <h2 className="__year">
                                        {t('experience.projects.item1.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.projects.item1.title')}
                                    </h1>
                                    <div className='details'>
                                        <h3 className="__subtitle">
                                            {t('experience.projects.item1.subtitle')}
                                        </h3>
                                        <div className='row'>
                                            <p className="__text">
                                                {t('experience.projects.item1.description')}
                                            </p>
                                        </div>
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
                                        <a href='https://www.npmjs.com/' target='_blank'>
                                            <div className='tech-tag' style={{paddingLeft: '12px', paddingBottom: '5px'}}>
                                                <img className='tech-logo' src={npm}/>
                                                <span className='tech-name'>npm</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </li>
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">
                                        {t('experience.projects.item2.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.projects.item2.title')}
                                    </h1>
                                    <div className='details'>
                                        <div className='row'>
                                            <div className='col-md-8'>
                                                <h3 className="__subtitle">
                                                    {t('experience.projects.item2.subtitle')}
                                                </h3>
                                                <p className="__text">
                                                    {t('experience.projects.item2.description')}
                                                </p>
                                            </div>
                                            <div className='col-md-4'>
                                                <img src={knowinnotes} style={{width: '100%'}}/>
                                            </div>
                                        </div>
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
                                        <a href='https://www.figma.com/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={figma}/>
                                                <span className='tech-name'>Figma</span>
                                            </div>
                                        </a>
                                        <a href='https://www.scrum.org/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={scrum}/>
                                                <span className='tech-name'>Scrum</span>
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
                                    <h2 className="__year">
                                        {t('experience.projects.item3.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.projects.item3.title')}
                                    </h1>
                                    <div className='details'>
                                        <div className='row'>
                                            <div className='col-md-8'>
                                                <h3 className="__subtitle">
                                                    {t('experience.projects.item3.subtitle')}
                                                </h3>
                                                <p className="__text">
                                                    {t('experience.projects.item3.description')}
                                                </p>
                                            </div>
                                            <div className='col-md-4'>
                                                <img src={SPGC} style={{width: '100%'}}/>
                                            </div>
                                        </div>
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
                                    <h2 className="__year">
                                        {t('experience.projects.item4.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.projects.item4.title')}
                                    </h1>
                                    <div className='details'>
                                        <div className='row'>
                                            <div className='col-md-8'>
                                                <h3 className="__subtitle">
                                                    {t('experience.projects.item4.subtitle')}
                                                </h3>
                                                <p className="__text">
                                                    {t('experience.projects.item4.description')}
                                                </p>
                                            </div>
                                            <div className='col-md-4'>
                                                <video src={baller} style={{width: '100%'}} autoPlay loop muted/>
                                            </div>
                                        </div>
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

            {display == "experience" &&
                <div className='row'>
                    <div className='col-md-8 offset-md-2 display'>
                        <div className="vl"/>
                        <ul className="list-component">
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">
                                        {t('experience.work.item1.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.work.item1.title')}
                                    </h1>
                                    <div className='details'>
                                        <h3 className="__subtitle"><a href='https://www.nbpower.com/' target='_blank' className='link'>NB Power</a> | <a href='https://www.google.com/maps?sca_esv=c39eac78d6ed00f6&output=search&q=bathurst&source=lnms&fbs=ABzOT_CWdhQLP1FcmU5B0fn3xuWpIgVFCTcbZI9VMGzNoV0iOZkckJJygdiLH6_g992ly-N3ZhTu1MHW3iZwH0a8xO8HGQfhZCtTE10EUDitcgLyPOPgcSN_kPyxmSMtP_k3VNkASaNYrGV87kHm_owanoPH3SM7ecLF7zpM_p1r5dQqP1vt46Of1Kso6kmAQmTbuei57KiiUCLyE_uV5d0FyAOsEKynGw&entry=mc&ved=1t:200715&ictx=111' target='_blank' className='link'>Bathurst, NB</a></h3>
                                        <p className="__text">
                                            {t('experience.work.item1.description')}
                                        </p>
                                    </div>
                                </div>
                            </li>
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">
                                        {t('experience.work.item2.date')}
                                    </h2>
                                    <h1 className="__title">
                                    {t('experience.work.item2.title')}
                                    </h1>
                                    <div className='details'>
                                        <h3 className="__subtitle"><a href='https://ranz-bontogon.com/' target='_blank' className='link'>RB Personal Contract</a> | <a href='https://www.google.com/maps/place/Moncton,+NB/@46.1131365,-64.9654078,11z/data=!3m1!4b1!4m6!3m5!1s0x4ca0b92918d41765:0xdc10a333a4e63c4!8m2!3d46.0878165!4d-64.7782313!16zL20vMDRfbGI?entry=ttu&g_ep=EgoyMDI1MDIwOS4wIKXMDSoASAFQAw%3D%3D' target='_blank' className='link'>Moncton, NB</a></h3>
                                        <p className="__text">
                                            {t('experience.work.item2.description')}
                                        </p>
                                    </div>
                                    <div className="tech-tags">
                                            <a href='https://www.w3schools.com/howto/howto_make_a_website.asp' target='_blank'>
                                                <div className='tech-tag'>
                                                    <img className='tech-logo corner' src={html}/>
                                                    <span className='tech-name'>HTML</span>
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
                                    <h2 className="__year">
                                        {t('experience.work.item3.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.work.item3.title')}
                                    </h1>
                                    <div className='details'>
                                        <h3 className="__subtitle"><a href='https://madisco.ca/' target='_blank' className='link'>Madisco Apartments</a> | <a href='https://www.google.com/maps?sca_esv=c62d8c7ed5b74a5b&output=search&q=bathurst&source=lnms&fbs=ABzOT_CWdhQLP1FcmU5B0fn3xuWpIgVFCTcbZI9VMGzNoV0iOZkckJJygdiLH6_g992ly-N56ueDsJ8PHmDNZqG8FmCe3GaMsJKZsLO8dQHXAa6ktp1Q-Ppm9Ty0oP3Vd8j148johs55TxuqqFtA_OuhVduB_ZaOlhwqZcpgdCmdxVKDjWMZtnYxAD8fUZ4o0y0NeFMuyYJZKylpMlFR_x_1-ojk1sLn1A&entry=mc&ved=1t:200715&ictx=111' target='_blank' className='link'>Bathurst, NB</a></h3>
                                        <p className="__text">
                                            {t('experience.work.item3.description')}
                                        </p>
                                    </div>
                                    <div className="tech-tags">
                                        <a href='https://www.google.com/streetview/' target='_blank'>
                                            <div className='tech-tag'>
                                                <img className='tech-logo corner' src={googlestreet}/>
                                                <span className='tech-name'>Google Street View</span>
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
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">
                                        {t('experience.work.item4.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.work.item4.title')}
                                    </h1>
                                    <div className='details'>
                                        <h3 className="__subtitle"><a href='https://mta.ca/' target='_blank' className='link'>Mount Allison University</a> | <a href='https://www.google.com/maps?sca_esv=c62d8c7ed5b74a5b&output=search&q=sackville&source=lnms&fbs=ABzOT_CWdhQLP1FcmU5B0fn3xuWpIgVFCTcbZI9VMGzNoV0iOZkckJJygdiLH6_g992ly-N3ZhTu1MHW3iZwH0a8xO8HZ5pNA7P1FP69xfs9dsZrpVtvYRlslfTiGgyLPI14HArMPvNAyR4_7szs0rY5DvThj6Rri2i4JggIDc-s9lYlJSzeOhba9FqUqpnBe0PRKj4cq4boj5Qwss4eSS7aEKBzI2TyEw&entry=mc&ved=1t:200715&ictx=111' target='_blank' className='link'>Sackville, NB</a></h3>
                                        <p className="__text">
                                            {t('experience.work.item4.description')}
                                        </p>
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
                                    <h2 className="__year">
                                        {t('experience.education.item1.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.education.item1.title')}
                                    </h1>
                                    <div className='details'>
                                        <h3 className="__subtitle"><a href='https://www.unb.ca/' target='_blank' className='link'>University of New Brunswick</a> | <a href='https://www.google.com/maps/place/Fredericton,+NB/@45.9453436,-66.8310588,11z/data=!3m1!4b1!4m6!3m5!1s0x4ca4220ba498fb2b:0xe7de2f297a415db4!8m2!3d45.9635895!4d-66.6431151!16zL20vMDJ3NzA?entry=ttu&g_ep=EgoyMDI1MDMwMy4wIKXMDSoASAFQAw%3D%3D' target='_blank' className='link'>Fredericton, NB</a></h3>
                                        <p className="__text">
                                            {t('experience.education.item1.description')}
                                        </p>
                                    </div>
                                </div>
                            </li>
                            <li className="__item">
                                <div className="card-component">
                                    <h2 className="__year">
                                        {t('experience.education.item2.date')}
                                    </h2>
                                    <h1 className="__title">
                                        {t('experience.education.item2.title')}
                                    </h1>
                                    <div className='details'>
                                        <h3 className="__subtitle"><a href='https://mta.ca/' target='_blank' className='link'>Mount Allison University</a> | <a href='https://www.google.com/maps?sca_esv=c62d8c7ed5b74a5b&output=search&q=sackville&source=lnms&fbs=ABzOT_CWdhQLP1FcmU5B0fn3xuWpIgVFCTcbZI9VMGzNoV0iOZkckJJygdiLH6_g992ly-N3ZhTu1MHW3iZwH0a8xO8HZ5pNA7P1FP69xfs9dsZrpVtvYRlslfTiGgyLPI14HArMPvNAyR4_7szs0rY5DvThj6Rri2i4JggIDc-s9lYlJSzeOhba9FqUqpnBe0PRKj4cq4boj5Qwss4eSS7aEKBzI2TyEw&entry=mc&ved=1t:200715&ictx=111' target='_blank' className='link'>Sackville, NB</a></h3>
                                        <p className="__text">
                                            {t('experience.education.item2.description')}
                                        </p>
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