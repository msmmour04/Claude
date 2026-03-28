import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Markets from './pages/Markets.jsx';
import Trade from './pages/Trade.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, paddingTop: '64px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
