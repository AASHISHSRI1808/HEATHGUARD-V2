import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.get('/predictions').then(res => setReports(res.data.predictions || [])).finally(() => setLoading(false));
  }, []);

  const handleDownload = async (id, reportId) => {
    setDownloading(id);
    try {
      const res = await api.get(`/predictions/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealthGuard_${reportId}.pdf`;
      a.click();
      toast.success('Report downloaded!');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const diseaseConfig = {
    Heart: { icon: '❤️', color: '#ef4444' },
    Liver: { icon: '🫀', color: '#f59e0b' },
    Parkinson: { icon: '🧠', color: '#8b5cf6' }
  };

  const riskColors = { Low: '#84CC16', Moderate: '#f59e0b', High: '#ef4444', 'Very High': '#dc2626' };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">My Reports</h1>
            <p className="page-subtitle">View and download all your prediction reports</p>
          </div>
          <Link to="/predict" className="btn btn-primary">New Prediction</Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <FileText size={60} style={{ marginBottom: '20px', color: 'var(--text-muted)', opacity: 0.4 }} />
            <h3 style={{ fontFamily: 'Outfit', color: 'var(--text-secondary)', marginBottom: '8px' }}>No reports yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Run your first prediction to generate a report</p>
            <Link to="/predict" className="btn btn-primary">Run Prediction</Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Disease</th>
                  <th>Result</th>
                  <th>Probability</th>
                  <th>Risk Level</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => {
                  const dc = diseaseConfig[report.diseaseType] || { icon: '🔬', color: '#64748b' };
                  const rc = riskColors[report.result?.riskLevel] || '#64748b';
                  return (
                    <tr key={report._id}>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', background: 'var(--bg-raised)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          {report.reportId}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{dc.icon}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{report.diseaseType}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${report.result?.prediction === 'Positive' ? 'danger' : 'success'}`}>
                          {report.result?.prediction}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'var(--bg-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${report.result?.probability}%`, height: '100%', background: rc, borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                            {report.result?.probability}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: rc, fontWeight: '600', fontSize: '13px' }}>
                          {report.result?.riskLevel}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          <Calendar size={13} /> {new Date(report.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/prediction-result/${report._id}`} className="btn btn-secondary btn-sm" title="View Report">
                            <Eye size={13} />
                          </Link>
                          <button onClick={() => handleDownload(report._id, report.reportId)} className="btn btn-primary btn-sm" disabled={downloading === report._id} title="Download PDF">
                            {downloading === report._id ? <div className="loading-spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }} /> : <Download size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
