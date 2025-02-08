import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { AnalyticsErrorBoundary } from './components/analytics/AnalyticsErrorBoundary';
import Routes from './Routes';

const App: React.FC = () => {
  return (
    <Router>
      <AnalyticsProvider>
        <AnalyticsErrorBoundary>
          <Routes />
        </AnalyticsErrorBoundary>
      </AnalyticsProvider>
    </Router>
  );
};

export default App;