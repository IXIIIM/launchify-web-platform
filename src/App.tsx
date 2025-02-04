import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// Pages
const Home = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-4">Welcome to Launchify</h1>
    <p className="text-lg text-gray-600">Connecting Entrepreneurs and Investors</p>
  </div>
)

const Dashboard = () => {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [data, setData] = React.useState(null)

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setData({
        matches: 5,
        messages: 12,
        profileViews: 34
      })
    }, 1000)
  }, [])

  if (isLoading) return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
        Error: Failed to load dashboard data
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Matches</h3>
          <p className="text-3xl font-bold text-blue-600">{data.matches}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Messages</h3>
          <p className="text-3xl font-bold text-blue-600">{data.messages}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Profile Views</h3>
          <p className="text-3xl font-bold text-blue-600">{data.profileViews}</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-600 text-white shadow">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex space-x-6 h-16 items-center">
              <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link></li>
              <li><Link to="/matching" className="hover:text-blue-200">Matching</Link></li>
              <li><Link to="/chat" className="hover:text-blue-200">Chat</Link></li>
              <li><Link to="/subscription" className="hover:text-blue-200">Subscription</Link></li>
              <li><Link to="/settings" className="hover:text-blue-200">Settings</Link></li>
            </ul>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/matching" element={<div className="p-6">Matching System</div>} />
            <Route path="/chat" element={<div className="p-6">Chat System</div>} />
            <Route path="/subscription" element={<div className="p-6">Subscription Plans</div>} />
            <Route path="/settings" element={<div className="p-6">Settings</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App