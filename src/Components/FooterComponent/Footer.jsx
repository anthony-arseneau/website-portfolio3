import React from 'react';
import './Footer.css';
import Links from '../LinksComponent/Links.jsx'
import { useTranslation } from 'react-i18next'; 

const Footer = () => {
  const { t } = useTranslation(); 
  return (
    <footer className="footer">
        <Links/>
        <p className='last-edited'>{t('last_updated')}</p>
    </footer>
  );
};

export default Footer;