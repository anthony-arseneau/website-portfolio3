import React from 'react'
import '../../../node_modules/bootstrap/dist/css/bootstrap.css' // Import bootstrap for styling
import './NavigationBar.css'
import videoBg from '../../assets/background4.mp4'

export const NavigationBar = () => {
  return (
        <nav className="navbar">
            <section className="navbar-container">
                <ul className="menu">
                    <li className="menu-list">
                        <a href="" className="menu-link">Home</a>
                    </li>
                    <li className="menu-list">
                        <a href="" className="menu-link">Contests</a>
                    </li>
                    <li className="menu-list">
                        <a href="" className="menu-link">About</a>
                    </li>
                </ul>
            </section>
        </nav>
  )
}

export default NavigationBar;