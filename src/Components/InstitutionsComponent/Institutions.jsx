import React from 'react'
import './Institutions.css'

import esn from '../../assets/esn_logo.png'
import mountallsion from '../../assets/mount_allison_logo.png'
import scienceatlantic from '../../assets/Science Atlantic Logo.png'
import icpc from '../../assets/ICPC Logo.png'

export const Institutions = () => {
  return (
    <div className="institutions-content">
        <div className="container">
            <a href="https://esn.nbed.nb.ca/" target="_blank">
                <img className='academic_logo' src={esn} alt="Mount Allison University logo"/>
            </a>
            <a href="https://mta.ca/" target="_blank">
                <img className="academic_logo" src={mountallsion} alt="Science logo"/>
            </a>
            <a href="https://scienceatlantic.ca/" target="_blank">
                <img className="academic_logo" src={scienceatlantic} alt="ESN logo"/>
            </a>
            <a href="https://ne.na.icpc.global/" target="_blank">
                <img className="academic_logo" src={icpc} alt="ICPC logo"/>
            </a>
        </div>
    </div>
  )
}

export default Institutions;