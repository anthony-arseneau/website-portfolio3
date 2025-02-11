import React from 'react'
import './Links.css'
import { FaLinkedinIn } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import { FaRegFileAlt } from "react-icons/fa";
import { LuSend } from "react-icons/lu";

export const Links = () => {
  return (
    <div className='links'>
        <section className="links-container">
            <ul className="links-menu">
                <li className="links-menu-list-rotate">
                    <a href="https://linkedin.com/in/anthonyarseneau" target='_blank' className="links-menu-link"><FaLinkedinIn/></a>
                </li>
                <li className="links-menu-list-rotate">
                    <a href="https://github.com/anthony-arseneau" target='_blank' className="links-menu-link"><FiGithub/></a>
                </li>
                <li className="links-menu-list">
                    <a href="" className="links-menu-link">Resume <FaRegFileAlt style={{marginTop: -2}}/></a>
                </li>
                <li className="links-menu-list-rotate">
                    <a onClick={() => window.location = 'mailto:anthony@arseneau.ai'} className="links-menu-link"><LuSend style={{marginLeft: -1}}/></a>
                </li>
            </ul>
        </section>
    </div>
  )
}

export default Links;