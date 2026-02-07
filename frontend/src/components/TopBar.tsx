import React, { useState, useEffect } from 'react';
import { Bell, User, ChevronDown, Play, CheckCircle, AlertCircle } from 'lucide-react';
import type { Client } from '../App';

interface TopBarProps {
  clients: Client[];
  selectedClient: string;
  onClientChange: (clientId: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ clients, selectedClient, onClientChange }) => {
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [runningScans, setRunningScans] = useState(3);
  const [completedScans, setCompletedScans] = useState(12);
  const [criticalFindings, setCriticalFindings] = useState(5);

  const notifications = [
    { id: '1', type: 'success', message: 'DAST scan completed for Tenant A', time: '2 min ago' },
    { id: '2', type: 'critical', message: '5 critical vulnerabilities found in Acme Corp', time: '15 min ago' },
    { id: '3', type: 'info', message: 'Container scan queued for GlobalTech', time: '1 hour ago' },
  ];

  const selectedClientObj = clients.find(c => c.id === selectedClient);

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="client-selector-wrapper">
          <button 
            className="client-selector"
            onClick={() => setShowClientDropdown(!showClientDropdown)}
          >
            <div className="client-info">
              <span className="client-label">Client</span>
              <span className="client-name">{selectedClientObj?.name || 'Select Client'}</span>
            </div>
            <ChevronDown size={20} />
          </button>
          
          {showClientDropdown && (
            <>
              <div 
                className="dropdown-overlay" 
                onClick={() => setShowClientDropdown(false)}
              />
              <div className="client-dropdown">
                {clients.map(client => (
                  <button
                    key={client.id}
                    className={`client-option ${selectedClient === client.id ? 'active' : ''}`}
                    onClick={() => {
                      onClientChange(client.id);
                      setShowClientDropdown(false);
                    }}
                  >
                    {client.name}
                    {selectedClient === client.id && <CheckCircle size={16} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="scan-status-indicators">
          <div className="status-indicator running">
            <Play size={16} fill="currentColor" />
            <span className="status-count">{runningScans}</span>
            <span className="status-label">Running</span>
          </div>
          <div className="status-indicator completed">
            <CheckCircle size={16} />
            <span className="status-count">{completedScans}</span>
            <span className="status-label">Completed Today</span>
          </div>
          <div className="status-indicator critical">
            <AlertCircle size={16} />
            <span className="status-count">{criticalFindings}</span>
            <span className="status-label">Critical Findings</span>
          </div>
        </div>
      </div>

      <div className="top-bar-right">
        <div className="notifications-wrapper">
          <button 
            className="icon-button notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
          </button>

          {showNotifications && (
            <>
              <div 
                className="dropdown-overlay" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h3>Notifications</h3>
                  <button className="mark-read-btn">Mark all as read</button>
                </div>
                <div className="notifications-list">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`notification-item ${notif.type}`}>
                      <div className="notification-content">
                        <p>{notif.message}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="user-profile">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">Security Tester</span>
            <span className="user-role">Senior Analyst</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;