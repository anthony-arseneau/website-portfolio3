import './Hero.css'
import profile from '../../assets/profile4.png'
import canadaFlag from '../../assets/canada_flag.png'
import videoBg from '../../assets/background4.mp4'
import { Links } from '../../Components/component_import.js'
import React, { useEffect, useState } from 'react'


function Hero() {
    const [isVisible, setIsVisible] = useState(false);

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
                        <a target='_blank' className='info-location' href='https://www.google.com/maps/place/Fredericton,+NB/@45.9453436,-66.8310588,11z/data=!3m1!4b1!4m6!3m5!1s0x4ca4220ba498fb2b:0xe7de2f297a415db4!8m2!3d45.9635895!4d-66.6431151!16zL20vMDJ3NzA?entry=ttu&g_ep=EgoyMDI1MDMxNy4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D'>
                            <h3>Fredericton NB, Canada<img className='flag' src={canadaFlag}></img></h3>
                        </a>
                    </div>
                </div>
                <div className='row'>
                    <h1 className={isVisible ? 'fade-up hero-title col-md-8 offset-md-2' : 'hero-title col-md-8 offset-md-2'}>MEng Mechanical Engineering Student <br/>& Computer Scientist</h1>
                </div>
                <Links/>
            </div>
        </>
    )
}

export default Hero;