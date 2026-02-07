import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css'; // Ensure global styles are applied

interface ScanTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

const scanTools: ScanTool[] = [
  {
    id: 'dast',
    title: 'DAST Scan',
    description: 'Dynamic Application Security Testing using OWASP ZAP.',
    icon: '🌐',
    route: '/tester/dast',
    color: '#4a9eff'
  },
  {
    id: 'sast',
    title: 'SAST Scan',
    description: 'Static Analysis via Semgrep to find vulnerabilities in code.',
    icon: '🔍',
    route: '/tester/sast',
    color: '#00e676'
  },
  {
    id: 'container',
    title: 'Container Scan',
    description: 'Vulnerability and misconfiguration scanning for Docker images.',
    icon: '📦',
    route: '/tester/container',
    color: '#ff9100'
  },
  {
    id: 'app',
    title: 'Mobile App Scan',
    description: 'Static and dynamic analysis of APKs using MobSF.',
    icon: '📱',
    route: '/tester/app',
    color: '#f50057'
  }
];

const TesterDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <h1>Tester Dashboard</h1>
        <p>Vulnerability Management & Assessment Toolset</p>
      </header>

      <div className="tool-grid">
        {scanTools.map((tool) => (
          <div 
            key={tool.id} 
            className="tool-card"
            onClick={() => navigate(tool.route)}
          >
            <div className="tool-icon" style={{ color: tool.color }}>
              {tool.icon}
            </div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <button className="launch-btn">Launch Scanner</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TesterDashboard;