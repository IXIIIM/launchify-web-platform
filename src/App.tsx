import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

// Placeholder Pages
const Home = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-4">Welcome to Launchify</h1>
    <p>Connecting Entrepreneurs and Investors</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="p-4 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto">
            <ul className="flex space-x-4">
              <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link></li>
              <li><Link to="/matching" className="hover:text-blue-200">Matching</Link></li>
              <li><Link to="/chat" className="hover:text-blue-200">Chat</Link></li>
              <li><Link to="/subscription" className="hover:text-blue-200">Subscription</Link></li>
              <li><Link to="/settings" className="hover:text-blue-200">Settings</Link></li>
            </ul>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/matching" element={<div>Matching System</div>} />
            <Route path="/chat" element={<div>Chat System</div>} />
            <Route path="/subscription" element={<div>Subscription Plans</div>} />
            <Route path="/settings" element={<div>Settings</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;