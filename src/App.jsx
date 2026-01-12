import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { Home } from './Pages/page_import.js'; // Import pages
import { ThemeProvider } from './context/ThemeContext';
import './i18n'; // before rendering components

function App() {
    return (
        <ThemeProvider>
            {/* Routing between pages */}
            <Router>
                {/* Routes */}
                <Routes>
                    {/* Home page link */}
                    <Route path="/" element={<Home />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
