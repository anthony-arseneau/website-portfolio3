import { useState } from 'react'
import '../../../node_modules/bootstrap/dist/css/bootstrap.css' // Import bootstrap for styling
import './Home.css'
import { Hero, NavigationBar, Experience, Institutions, Footer } from '../../Components/component_import.js'

function Home() {
    return (
        <>
                <NavigationBar/>

                <Hero/>

                <Institutions/>

                <Experience/>

                <Footer/>
        </>
    )
}

export default Home;