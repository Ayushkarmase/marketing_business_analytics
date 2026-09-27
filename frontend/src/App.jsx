import React, { useState } from 'react';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import DataSourcesView from './views/DataSourcesView';
import SegmentationView from './views/SegmentationView';
import ForecastingView from './views/ForecastingView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import AuthModal from './components/AuthModal';
import './index.css';

const VIEWS = {
  dashboard: DashboardView,
  datasources: DataSourcesView,
  segmentation: SegmentationView,
  forecasting: ForecastingView,
  reports: ReportsView,
  settings: SettingsView
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const ActiveView = VIEWS[activeTab] || DashboardView;

  const handleOpenAuth = (tabName = 'login') => {
    setAuthModalTab(tabName);
    setAuthModalOpen(true);
  };

  return (
    <AuthProvider>
      <BusinessProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
          <Navbar onOpenAuth={handleOpenAuth} />
          <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 65px)' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg-primary)' }}>
              <ActiveView onNavigate={setActiveTab} />
            </main>
          </div>

          <AuthModal
            isOpen={authModalOpen}
            initialTab={authModalTab}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </BusinessProvider>
    </AuthProvider>
  );
}
