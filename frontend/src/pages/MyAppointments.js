import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { Calendar, Clock, MapPin, Download, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/appointments').then(res => setAppointments(res.data.appointments || [])).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}/cancel`);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'Cancelled' } : a));
      toast.success('Appointment cancelled');
    } catch (err) {
      toast.error('Cancellation failed');
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  const statusConfig = {
    Pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    Confirmed: { color: '#84CC16', bg: 'rgba(132,204,22,0.10)', border: 'rgba(132,204,22,0.30)' },
    Completed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
    Cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">My Appointments</h1>
            <p className="page-subtitle">Track all your doctor consultations</p>
          </div>
          <Link to="/doctors" className="btn btn-primary">Book New Appointment</Link>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-raised)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
          {['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600', fontFamily: 'Outfit',
                background: filter === f ? 'var(--accent)' : 'transparent',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}>
              {f === 'all' ? 'All' : f} {f === 'all' ? `(${appointments.length})` : `(${appointments.filter(a => a.status === f).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '60px' }}>📅</span>
            <h3 style={{ fontFamily: 'Outfit', marginTop: '20px', color: 'var(--text-secondary)' }}>No appointments found</h3>
            <Link to="/doctors" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>Find a Doctor</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(appt => {
              const sc = statusConfig[appt.status] || statusConfig.Pending;
              return (
                <div key={appt._id} className="card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                    👨‍⚕️
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Dr. {appt.doctorId?.name || 'Doctor'}
                      </h3>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                        {appt.status}
                      </span>
                      {appt.paymentStatus === 'Paid' && <span className="badge badge-success" style={{ fontSize: '11px' }}>💳 Paid</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '8px' }}>{appt.doctorId?.specialization}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <Calendar size={13} /> {new Date(appt.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <Clock size={13} /> {appt.timeSlot}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <MapPin size={13} /> {appt.doctorId?.hospitalName}, {appt.doctorId?.city}
                      </span>
                    </div>
                    {appt.notes && <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>Note: {appt.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Amount</div>
                      <div style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>₹{appt.amount}</div>
                    </div>
                    {appt.predictionId && (
                      <Link to={`/prediction-result/${appt.predictionId._id || appt.predictionId}`} className="btn btn-secondary btn-sm">
                        <Download size={13} /> Report
                      </Link>
                    )}
                    {appt.status === 'Pending' && (
                      <button onClick={() => handleCancel(appt._id)} className="btn btn-danger btn-sm">
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
