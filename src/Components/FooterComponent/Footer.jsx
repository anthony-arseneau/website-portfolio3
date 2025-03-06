import React from 'react';
import './Footer.css';
import Links from '../LinksComponent/Links.jsx'

const Footer = () => {
  return (
    <footer className="footer">
        <Links/>
        <p className='last-edited'>Last edited: March 6, 2025</p>
    </footer>
  );
};

export default Footer;