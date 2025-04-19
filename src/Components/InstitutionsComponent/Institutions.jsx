import React from 'react'
import './Institutions.css'

import mountallsion from '../../assets/mount_allison_logo.png'
import unb from '../../assets/unb_logo.png'
import nbpower from '../../assets/nbpower_logo.png'
import scienceatlantic from '../../assets/Science Atlantic Logo.png'
import icpc from '../../assets/ICPC Logo.png'
import rb from '../../assets/ranz_bontogon_logo.png'
import madisco from '../../assets/madisco_apartments_logo.png'

export const Institutions = () => {
  return (
    <div className="institutions-content">
        <div className="container">
            <a className="academic_link" href="https://mta.ca/" target="_blank">
                <img className="academic_logo" src={mountallsion} alt="MTA logo"/>
            </a>
            <a className="academic_link" href="https://www.unb.ca/" target="_blank">
                <img className="academic_logo" src={unb} alt="UNB logo"/>
            </a>
            <a className="academic_link" href="https://www.nbpower.com/" target="_blank">
                <img className="academic_logo" src={nbpower} alt="NB Power logo"/>
            </a>
            <a className="academic_link" href="https://ranz-bontogon.com/" target="_blank">
                <img className="academic_logo" src={rb} alt="RB logo"/>
            </a>
            <a className="academic_link" href="https://madisco.ca/" target="_blank">
                <img className="academic_logo" src={madisco} alt="Madisco logo"/>
            </a>
            <a className="academic_link" href="https://scienceatlantic.ca/" target="_blank">
                <img className="academic_logo" src={scienceatlantic} alt="Science Atlantic logo"/>
            </a>
            <a className="academic_link" href="https://ne.na.icpc.global/" target="_blank">
                <img className="academic_logo" src={icpc} alt="ICPC logo"/>
            </a>
        </div>
    </div>
  )
}

export default Institutions;