import { useState } from 'react'
import '../../../node_modules/bootstrap/dist/css/bootstrap.css' // Import bootstrap for styling
import './Home.css'
import { Hero, NavigationBar, Experience, Institutions, Footer } from '../../Components/component_import.js'
import TechStack from '../../Components/TechStackComponent/TechStack.jsx'

function Home() {
    return (
        <>
                <NavigationBar/>

                <Hero/>

                <Institutions/>

                <Experience/>

                <TechStack/>

                <Footer/>
        </>
    )
}

export default Home;