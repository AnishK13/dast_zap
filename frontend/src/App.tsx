import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import ScanCommandCenter from './components/ScanCommandCenter';
// import TriageView from './components/TriageView';
// import Analytics from './components/Analytics';
// import Reports from './components/Reports';

export type ScanType = 'sast' | 'dast' | 'mobile' | 'container';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
  id: string;
  title: string;
  severity: SeverityLevel;
  scanType: ScanType;
  clientId: string;
  status: 'open' | 'in-progress' | 'resolved' | 'false-positive';
  foundDate: Date;
  resolvedDate?: Date;
  description: string;
  isFalsePositive: boolean;
  fpReason?: string;
  originalSeverity?: SeverityLevel;
}

export interface ScanJob {
  id: string;
  scanType: ScanType;
  clientId: string;
  target: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: Date;
  endTime?: Date;
  currentActivity?: string;
}

export interface Client {
  id: string;
  name: string;
  logo?: string;
}

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'scan' | 'triage' | 'analytics' | 'reports'>('dashboard');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);

  const clients: Client[] = [
    { id: 'all', name: 'All Clients' },
    { id: 'tenant-a', name: 'Tenant A' },
    { id: 'tenant-b', name: 'Tenant B' },
    { id: 'tenant-c', name: 'Acme Corp' },
    { id: 'tenant-d', name: 'GlobalTech Industries' },
  ];

  const handleScanTypeClick = (scanType: ScanType) => {
    setSelectedScanType(scanType);
    setActiveView('scan');
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onScanTypeClick={handleScanTypeClick} selectedClient={selectedClient} />;
      case 'scan':
        return <ScanCommandCenter initialScanType={selectedScanType} selectedClient={selectedClient} />;
      case 'triage':
        return <TriageView selectedClient={selectedClient} />;
      case 'analytics':
        return <Analytics selectedClient={selectedClient} />;
      case 'reports':
        return <Reports selectedClient={selectedClient} />;
      default:
        return <Dashboard onScanTypeClick={handleScanTypeClick} selectedClient={selectedClient} />;
    }
  };

  return (
    <div className="app">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        onScanTypeClick={handleScanTypeClick}
      />
      <div className="main-container">
        <TopBar 
          clients={clients}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
        />
        <main className="content-area">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default App;