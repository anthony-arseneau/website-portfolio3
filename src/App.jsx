// NOTE: BrowserRouter requires your nginx config to include:
//   location / { try_files $uri $uri/ /index.html; }
// This ensures direct URL access and page refreshes are handled by the SPA.
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
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
