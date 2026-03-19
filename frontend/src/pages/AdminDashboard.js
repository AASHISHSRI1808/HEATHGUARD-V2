import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, doctorsRes, usersRes, predsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/doctors'),
        api.get('/admin/users'),
        api.get('/admin/predictions')
      ]);
      setStats(statsRes.data.stats || {});
      setDoctors(doctorsRes.data.doctors || []);
      setUsers(usersRes.data.users || []);
      setPredictions(predsRes.data.predictions || []);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/doctors/${id}/approve`);
      toast.success('✅ Doctor approved! Approval email sent.');
      fetchData();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/doctors/${id}/reject`, { reason: rejectReason });
      toast.success('Doctor rejected. Rejection email sent.');
      setRejectingId(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  const pendingDoctors = doctors.filter(d => d.status === 'PENDING');
  const activeDoctors = doctors.filter(d => d.status === 'ACTIVE');
  const rejectedDoctors = doctors.filter(d => d.status === 'REJECTED');

  const TABS = [
    { key: 'pending', label: `⏳ Pending`, count: pendingDoctors.length },
    { key: 'active', label: `✅ Active Doctors`, count: activeDoctors.length },
    { key: 'rejected', label: `❌ Rejected`, count: rejectedDoctors.length },
    { key: 'users', label: `👥 Patients`, count: users.length },
    { key: 'predictions', label: `🔬 Predictions`, count: predictions.length }
  ];

  const currentDoctors = activeTab === 'pending' ? pendingDoctors : activeTab === 'active' ? activeDoctors : rejectedDoctors;

  const statusBadge = (status) => {
    const map = { PENDING: 'badge-warning', ACTIVE: 'badge-success', REJECTED: 'badge-danger' };
    return map[status] || 'badge-info';
  };

  const riskColors = { Low: '#84CC16', Moderate: '#f59e0b', High: '#ef4444', 'Very High': '#dc2626' };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage doctors, patients, and platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          {[
            { icon: '👥', label: 'Total Patients', val: stats.totalUsers || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            { icon: '✅', label: 'Active Doctors', val: stats.activeDoctors || 0, color: '#84CC16', bg: 'rgba(132,204,22,0.10)' },
            { icon: '⏳', label: 'Pending Approval', val: stats.pendingDoctors || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { icon: '🔬', label: 'Total Predictions', val: stats.totalPredictions || 0, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' }
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, fontSize: '26px' }}>{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Alert */}
        {pendingDoctors.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
            ⚠️ <strong>{pendingDoctors.length} doctor(s)</strong> are awaiting approval. Review their applications below.
          </div>
        )}

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-raised)', padding: '4px', borderRadius: '12px', width: 'fit-content', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600', fontFamily: 'Outfit',
                background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {/* Doctor Lists */}
            {['pending', 'active', 'rejected'].includes(activeTab) && (
              currentDoctors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '56px' }}>👨‍⚕️</span>
                  <h3 style={{ fontFamily: 'Outfit', marginTop: '16px', color: 'var(--text-secondary)' }}>No {activeTab} doctors</h3>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentDoctors.map(doctor => (
                    <div key={doctor._id} className="card">
                      {/* Reject Modal */}
                      {rejectingId === doctor._id && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Reject Doctor Application</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                              Rejecting: <strong style={{ color: 'var(--text-primary)' }}>Dr. {doctor.name}</strong>
                            </p>
                            <div className="form-group">
                              <label className="form-label">Rejection Reason (Optional)</label>
                              <textarea className="form-input" rows={3} value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="e.g. Invalid MCI number, incomplete documents..."
                                style={{ resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button onClick={() => handleReject(doctor._id)} className="btn btn-danger" style={{ flex: 1 }}>
                                Confirm Rejection
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="btn btn-secondary" style={{ flex: 1 }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                          👨‍⚕️
                        </div>

                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Dr. {doctor.name}
                            </h3>
                            <span className={`badge ${statusBadge(doctor.status)}`}>{doctor.status}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 20px' }}>
                            {[
                              { label: 'Email', val: doctor.email },
                              { label: 'Mobile', val: doctor.mobile },
                              { label: 'Specialization', val: doctor.specialization },
                              { label: 'Experience', val: `${doctor.experience} years` },
                              { label: 'MCI Number', val: doctor.mciNumber },
                              { label: 'Hospital', val: doctor.hospitalName },
                              { label: 'City', val: `${doctor.city}, ${doctor.state}` },
                              { label: 'Fee', val: `₹${doctor.consultationFee}` },
                              { label: 'Applied On', val: new Date(doctor.createdAt).toLocaleDateString('en-IN') },
                            ].map((item, i) => (
                              <div key={i}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.val}</div>
                              </div>
                            ))}
                          </div>
                          {doctor.about && (
                            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{doctor.about}"</p>
                          )}
                        </div>

                        {activeTab === 'pending' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                            <button onClick={() => handleApprove(doctor._id)} className="btn btn-success">
                              ✅ Approve
                            </button>
                            <button onClick={() => setRejectingId(doctor._id)} className="btn btn-danger">
                              ❌ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Patients Tab */}
            {activeTab === 'users' && (
              users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '56px' }}>👥</span>
                  <h3 style={{ fontFamily: 'Outfit', marginTop: '16px', color: 'var(--text-secondary)' }}>No patients registered yet</h3>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Blood Group</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u._id}>
                          <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{i + 1}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.mobile}</td>
                          <td>{u.age || '—'}</td>
                          <td>{u.gender || '—'}</td>
                          <td>
                            {u.bloodGroup ? (
                              <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>{u.bloodGroup}</span>
                            ) : '—'}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
              predictions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '56px' }}>🔬</span>
                  <h3 style={{ fontFamily: 'Outfit', marginTop: '16px', color: 'var(--text-secondary)' }}>No predictions yet</h3>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>Patient</th>
                        <th>Disease</th>
                        <th>Result</th>
                        <th>Probability</th>
                        <th>Risk</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map(p => (
                        <tr key={p._id}>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', background: 'var(--bg-raised)', padding: '3px 7px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                              {p.reportId}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {p.userId?.name || p.patientName}
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>{p.userId?.email}</div>
                          </td>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {p.diseaseType === 'Heart' ? '❤️' : p.diseaseType === 'Liver' ? '🫀' : '🧠'}
                              {p.diseaseType}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${p.result?.prediction === 'Positive' ? 'danger' : 'success'}`}>
                              {p.result?.prediction}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {p.result?.probability}%
                            </span>
                          </td>
                          <td>
                            <span style={{ color: riskColors[p.result?.riskLevel] || '#64748b', fontWeight: '600', fontSize: '13px' }}>
                              {p.result?.riskLevel}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(p.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
