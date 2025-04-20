import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { Home } from './Pages/page_import.js'; // Import pages

function App() {
    return (
        <>
            {/* Routing between pages */}
            <Router>
                {/* Routes */}
                <Routes>
                    {/* Home page link */}
                    <Route path="/" element={<Home />} />
                </Routes>
            </Router>
        </>
    );
}

export default App;
