import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// Pages
const Home = () => (
  <div>
    <h1>Welcome to Launchify</h1>
    <p>Connecting Entrepreneurs and Investors</p>
  </div>
)

const Dashboard = () => (
  <div>
    <h1>Dashboard</h1>
    <p>Your investment and entrepreneurship overview</p>
  </div>
)

const MatchingPage = () => (
  <div>
    <h1>Find Matches</h1>
    <p>Discover potential investors or entrepreneurs</p>
  </div>
)

function App() {
  return (
    <Router>
      <div>
        <nav className="p-4 bg-blue-600 text-white">
          <ul className="flex space-x-4">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/matching">Matching</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/subscription">Subscription</Link></li>
            <li><Link to="/settings">Settings</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/chat" element={<div>Chat System</div>} />
          <Route path="/subscription" element={<div>Subscription Plans</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App