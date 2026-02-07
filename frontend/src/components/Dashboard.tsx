import React from 'react';
import { 
  FileSearch, 
  Activity, 
  Smartphone, 
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import type { ScanType } from '../App';

interface DashboardProps {
  onScanTypeClick: (scanType: ScanType) => void;
  selectedClient: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onScanTypeClick, selectedClient }) => {
  const scanTypes = [
    { 
      type: 'sast' as ScanType, 
      label: 'SAST', 
      icon: FileSearch, 
      color: '#3b82f6',
      description: 'Static Application Security Testing',
      stats: { total: 156, critical: 12, high: 34, medium: 78, low: 32 }
    },
    { 
      type: 'dast' as ScanType, 
      label: 'DAST', 
      icon: Activity, 
      color: '#8b5cf6',
      description: 'Dynamic Application Security Testing',
      stats: { total: 89, critical: 8, high: 21, medium: 45, low: 15 }
    },
    { 
      type: 'mobile' as ScanType, 
      label: 'Mobile App Scan', 
      icon: Smartphone, 
      color: '#ec4899',
      description: 'Mobile Application Security',
      stats: { total: 43, critical: 5, high: 12, medium: 18, low: 8 }
    },
    { 
      type: 'container' as ScanType, 
      label: 'Container Scan', 
      icon: Package, 
      color: '#f59e0b',
      description: 'Container Image Vulnerability Scan',
      stats: { total: 234, critical: 18, high: 56, medium: 112, low: 48 }
    },
  ];

  const overviewStats = [
    {
      title: 'Total Vulnerabilities',
      value: '522',
      change: '+12%',
      trend: 'up',
      icon: AlertTriangle,
      color: '#ef4444'
    },
    {
      title: 'Critical Findings',
      value: '43',
      change: '-5%',
      trend: 'down',
      icon: AlertTriangle,
      color: '#dc2626'
    },
    {
      title: 'Avg. MTTR',
      value: '4.2 days',
      change: '-18%',
      trend: 'down',
      icon: Clock,
      color: '#8b5cf6'
    },
    {
      title: 'Resolved This Week',
      value: '87',
      change: '+23%',
      trend: 'up',
      icon: CheckCircle2,
      color: '#22c55e'
    },
  ];

  const recentScans = [
    { id: '1', client: 'Tenant A', type: 'DAST', target: 'app.tenant-a.com', status: 'completed', findings: 12 },
    { id: '2', client: 'Acme Corp', type: 'SAST', target: 'github.com/acme/webapp', status: 'running', findings: 0 },
    { id: '3', client: 'GlobalTech', type: 'Container', target: 'registry/app:latest', status: 'completed', findings: 34 },
    { id: '4', client: 'Tenant B', type: 'Mobile', target: 'com.tenantb.app', status: 'queued', findings: 0 },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Security Testing Dashboard</h1>
          <p className="subtitle">
            {selectedClient === 'all' ? 'All Clients' : selectedClient} - Overview
          </p>
        </div>
      </div>

      <div className="overview-cards">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="overview-card">
              <div className="overview-card-icon" style={{ backgroundColor: `${stat.color}15` }}>
                <Icon size={24} color={stat.color} />
              </div>
              <div className="overview-card-content">
                <p className="overview-card-title">{stat.title}</p>
                <h2 className="overview-card-value">{stat.value}</h2>
                <div className={`overview-card-change ${stat.trend}`}>
                  <TrendingUp size={14} />
                  <span>{stat.change} from last week</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="scan-types-grid">
        <h2 className="section-title">Scan Types</h2>
        <div className="scan-type-cards">
          {scanTypes.map(scan => {
            const Icon = scan.icon;
            return (
              <div 
                key={scan.type} 
                className="scan-type-card"
                onClick={() => onScanTypeClick(scan.type)}
              >
                <div className="scan-type-card-header">
                  <div 
                    className="scan-type-card-icon"
                    style={{ backgroundColor: `${scan.color}15` }}
                  >
                    <Icon size={28} color={scan.color} />
                  </div>
                  <div className="scan-type-card-title">
                    <h3>{scan.label}</h3>
                    <p>{scan.description}</p>
                  </div>
                </div>
                
                <div className="scan-type-stats">
                  <div className="stat-row">
                    <span className="stat-label">Total Findings:</span>
                    <span className="stat-value">{scan.stats.total}</span>
                  </div>
                  <div className="severity-breakdown">
                    <div className="severity-item critical">
                      <span className="severity-dot"></span>
                      <span>{scan.stats.critical} Critical</span>
                    </div>
                    <div className="severity-item high">
                      <span className="severity-dot"></span>
                      <span>{scan.stats.high} High</span>
                    </div>
                    <div className="severity-item medium">
                      <span className="severity-dot"></span>
                      <span>{scan.stats.medium} Medium</span>
                    </div>
                    <div className="severity-item low">
                      <span className="severity-dot"></span>
                      <span>{scan.stats.low} Low</span>
                    </div>
                  </div>
                </div>

                <button className="scan-type-card-action">
                  Start New Scan →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="recent-scans-section">
        <h2 className="section-title">Recent Scans</h2>
        <div className="recent-scans-table">
          <div className="table-header">
            <div className="table-cell">Client</div>
            <div className="table-cell">Scan Type</div>
            <div className="table-cell">Target</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Findings</div>
          </div>
          {recentScans.map(scan => (
            <div key={scan.id} className="table-row">
              <div className="table-cell">{scan.client}</div>
              <div className="table-cell">
                <span className="scan-type-badge">{scan.type}</span>
              </div>
              <div className="table-cell code">{scan.target}</div>
              <div className="table-cell">
                <span className={`status-badge ${scan.status}`}>{scan.status}</span>
              </div>
              <div className="table-cell">
                {scan.status === 'completed' && (
                  <span className="findings-count">{scan.findings}</span>
                )}
                {scan.status === 'running' && (
                  <span className="running-indicator">In Progress...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;