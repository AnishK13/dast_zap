import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  ChevronRight,
  FileSearch,
  Activity,
  Smartphone,
  Package,
  Clock,
  Target,
  Settings as SettingsIcon
} from 'lucide-react';
import type { ScanType, ScanJob } from '../App';

interface ScanCommandCenterProps {
  initialScanType: ScanType | null;
  selectedClient: string;
}

const ScanCommandCenter: React.FC<ScanCommandCenterProps> = ({ initialScanType, selectedClient }) => {
  const [showLauncher, setShowLauncher] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(initialScanType);
  const [target, setTarget] = useState('');
  const [scanProfile, setScanProfile] = useState<'aggressive' | 'stealth'>('aggressive');
  const [scanJobs, setScanJobs] = useState<ScanJob[]>([
    {
      id: 'scan-1',
      scanType: 'dast',
      clientId: 'tenant-a',
      target: 'https://app.tenant-a.com',
      status: 'running',
      progress: 67,
      startTime: new Date(Date.now() - 15 * 60000),
      currentActivity: 'Crawling /api/users endpoint...'
    },
    {
      id: 'scan-2',
      scanType: 'sast',
      clientId: 'acme',
      target: 'github.com/acme/webapp',
      status: 'running',
      progress: 34,
      startTime: new Date(Date.now() - 8 * 60000),
      currentActivity: 'Analyzing src/auth/login.js (342/1000 files)'
    },
    {
      id: 'scan-3',
      scanType: 'container',
      clientId: 'globaltech',
      target: 'registry/app:v2.1.0',
      status: 'queued',
      progress: 0,
      startTime: new Date(),
    },
  ]);

  const scanTypeIcons = {
    sast: FileSearch,
    dast: Activity,
    mobile: Smartphone,
    container: Package,
  };

  const scanTypeColors = {
    sast: '#3b82f6',
    dast: '#8b5cf6',
    mobile: '#ec4899',
    container: '#f59e0b',
  };

  useEffect(() => {
    if (initialScanType) {
      setShowLauncher(true);
    }
  }, [initialScanType]);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setScanJobs(prev => prev.map(job => {
        if (job.status === 'running' && job.progress < 100) {
          const newProgress = Math.min(job.progress + Math.random() * 5, 100);
          return {
            ...job,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'running',
            endTime: newProgress >= 100 ? new Date() : undefined,
          };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleStartScan = () => {
    if (!selectedScanType || !target) return;

    const newJob: ScanJob = {
      id: `scan-${Date.now()}`,
      scanType: selectedScanType,
      clientId: selectedClient,
      target,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      currentActivity: 'Initializing scan...'
    };

    setScanJobs(prev => [newJob, ...prev]);
    setShowLauncher(false);
    setTarget('');
    setSelectedScanType(null);
  };

  const handlePauseScan = (jobId: string) => {
    setScanJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: job.status === 'paused' ? 'running' : 'paused' } as ScanJob : job
    ));
  };

  const handleStopScan = (jobId: string) => {
    setScanJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const getElapsedTime = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const diff = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="scan-command-center">
      <div className="command-center-header">
        <div>
          <h1>Scan Command Center</h1>
          <p className="subtitle">Execute and manage security scans</p>
        </div>
        <button 
          className="primary-button"
          onClick={() => setShowLauncher(true)}
        >
          <Play size={18} />
          Launch New Scan
        </button>
      </div>

      {showLauncher && (
        <div className="scan-launcher-modal">
          <div className="modal-overlay" onClick={() => setShowLauncher(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>Configure New Scan</h2>
              <button className="close-button" onClick={() => setShowLauncher(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Scan Type</label>
                <div className="scan-type-selector">
                  {(['sast', 'dast', 'mobile', 'container'] as ScanType[]).map(type => {
                    const Icon = scanTypeIcons[type];
                    const isSelected = selectedScanType === type;
                    return (
                      <button
                        key={type}
                        className={`scan-type-option ${isSelected ? 'selected' : ''}`}
                        style={{ '--type-color': scanTypeColors[type] } as React.CSSProperties}
                        onClick={() => setSelectedScanType(type)}
                      >
                        <Icon size={24} />
                        <span>{type.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Target</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={
                    selectedScanType === 'sast' ? 'Enter repository URL (e.g., github.com/org/repo)' :
                    selectedScanType === 'dast' ? 'Enter web URL (e.g., https://app.example.com)' :
                    selectedScanType === 'mobile' ? 'Enter app package name or file path' :
                    'Enter container image (e.g., registry/image:tag)'
                  }
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Scan Profile</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="profile"
                      checked={scanProfile === 'aggressive'}
                      onChange={() => setScanProfile('aggressive')}
                    />
                    <div>
                      <strong>Aggressive</strong>
                      <p>Comprehensive scan with maximum coverage</p>
                    </div>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="profile"
                      checked={scanProfile === 'stealth'}
                      onChange={() => setScanProfile('stealth')}
                    />
                    <div>
                      <strong>Stealth</strong>
                      <p>Low-impact scan to avoid detection</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setShowLauncher(false)}>
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleStartScan}
                disabled={!selectedScanType || !target}
              >
                <Play size={18} />
                Start Scan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="scan-queue">
        <h2 className="section-title">Active & Queued Scans</h2>
        
        {scanJobs.length === 0 ? (
          <div className="empty-state">
            <Target size={48} />
            <p>No active scans</p>
            <button className="primary-button" onClick={() => setShowLauncher(true)}>
              Launch Your First Scan
            </button>
          </div>
        ) : (
          <div className="scan-jobs-list">
            {scanJobs.map(job => {
              const Icon = scanTypeIcons[job.scanType];
              return (
                <div key={job.id} className={`scan-job-card ${job.status}`}>
                  <div className="scan-job-header">
                    <div className="scan-job-info">
                      <div 
                        className="scan-job-icon"
                        style={{ backgroundColor: `${scanTypeColors[job.scanType]}15` }}
                      >
                        <Icon size={24} color={scanTypeColors[job.scanType]} />
                      </div>
                      <div>
                        <h3>{job.scanType.toUpperCase()} Scan</h3>
                        <p className="scan-target">{job.target}</p>
                      </div>
                    </div>
                    <div className="scan-job-actions">
                      {job.status === 'running' && (
                        <button 
                          className="icon-button"
                          onClick={() => handlePauseScan(job.id)}
                          title="Pause"
                        >
                          <Pause size={18} />
                        </button>
                      )}
                      {job.status === 'paused' && (
                        <button 
                          className="icon-button"
                          onClick={() => handlePauseScan(job.id)}
                          title="Resume"
                        >
                          <Play size={18} />
                        </button>
                      )}
                      <button 
                        className="icon-button danger"
                        onClick={() => handleStopScan(job.id)}
                        title="Stop"
                      >
                        <Square size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="scan-job-progress">
                    <div className="progress-info">
                      <span className={`status-badge ${job.status}`}>{job.status}</span>
                      <span className="progress-percentage">{Math.round(job.progress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${job.progress}%`,
                          backgroundColor: scanTypeColors[job.scanType]
                        }}
                      />
                    </div>
                  </div>

                  {job.currentActivity && job.status === 'running' && (
                    <div className="scan-job-activity">
                      <ChevronRight size={16} />
                      <span>{job.currentActivity}</span>
                    </div>
                  )}

                  <div className="scan-job-meta">
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>Started: {job.startTime.toLocaleTimeString()}</span>
                    </div>
                    <div className="meta-item">
                      <span>Elapsed: {getElapsedTime(job.startTime, job.endTime)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanCommandCenter;