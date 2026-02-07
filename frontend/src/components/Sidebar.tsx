import React from 'react';
import { 
  LayoutDashboard, 
  FileSearch, 
  Activity, 
  Smartphone, 
  Package,
  BarChart3,
  FileText,
  Calendar,
  Database,
  Settings
} from 'lucide-react';
import type { ScanType } from '../App';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: 'dashboard' | 'scan' | 'triage' | 'analytics' | 'reports') => void;
  onScanTypeClick: (scanType: ScanType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onScanTypeClick }) => {
  const scanTypes = [
    { type: 'sast' as ScanType, label: 'SAST', icon: FileSearch, color: '#3b82f6' },
    { type: 'dast' as ScanType, label: 'DAST', icon: Activity, color: '#8b5cf6' },
    { type: 'mobile' as ScanType, label: 'Mobile App Scan', icon: Smartphone, color: '#ec4899' },
    { type: 'container' as ScanType, label: 'Container', icon: Package, color: '#f59e0b' },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'triage', label: 'Triage View', icon: FileSearch },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">🛡️</div>
          <h1>VulnScan</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Navigation</div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => onViewChange(item.id as any)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="nav-section scan-types-section">
          <div className="nav-section-title">Scan Types</div>
          {scanTypes.map(scan => {
            const Icon = scan.icon;
            return (
              <button
                key={scan.type}
                className="scan-type-button"
                style={{ '--scan-color': scan.color } as React.CSSProperties}
                onClick={() => onScanTypeClick(scan.type)}
              >
                <div className="scan-type-icon">
                  <Icon size={20} />
                </div>
                <span>{scan.label}</span>
              </button>
            );
          })}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Management</div>
          <button className="nav-item">
            <Calendar size={20} />
            <span>Scan Scheduler</span>
          </button>
          <button className="nav-item">
            <Database size={20} />
            <span>Vulnerability Library</span>
          </button>
          <button className="nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;