import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Activity, CheckCircle } from 'lucide-react';

export default function DoctorRegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', mobile: '', mciNumber: '',
    specialization: '', experience: '', hospitalName: '', city: '', state: '',
    consultationFee: '500', about: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { registerDoctor } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerDoctor(form);
      setSuccess(true);
      toast.success('Registration submitted for approval!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '440px' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(132,204,22,0.12)', border: '2px solid #84CC16', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle size={40} color="#84CC16" />
        </div>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Application Submitted!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.7 }}>
          Your doctor registration has been received. Our admin will review your credentials and send you an approval email within 24-48 hours.
        </p>
        <Link to="/" className="btn btn-primary">Return to Home</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '80px 24px 40px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '40px', textDecoration: 'none' }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--gradient-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Health<span style={{ color: 'var(--accent)' }}>Guard</span></span>
        </Link>

        <div className="card" style={{ padding: '40px' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Doctor Registration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Submit your credentials for admin approval to join Health Guard.</p>
          <div className="alert alert-warning" style={{ marginBottom: '28px', fontSize: '13px' }}>
            ⚠️ Your account will be reviewed and approved by our admin team before you can login.
          </div>

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Personal Details</h3>
            <div className="grid-2">
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. John Doe', required: true },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'dr.john@hospital.com', required: true },
                { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters', required: true },
                { key: 'mobile', label: 'Mobile', type: 'tel', placeholder: '+91 9876543210', required: true },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input type={f.type} className="form-input" placeholder={f.placeholder} required={f.required}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>

            <h3 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', margin: '8px 0 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Professional Details</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">MCI Registration Number *</label>
                <input type="text" className="form-input" placeholder="MCI-12345" required
                  value={form.mciNumber} onChange={e => setForm({ ...form, mciNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Specialization *</label>
                <select className="form-input" required value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}>
                  <option value="">Select Specialization</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Hepatologist">Hepatologist</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="General Physician">General Physician</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Experience (Years) *</label>
                <input type="number" className="form-input form-input-number" placeholder="10" min="0" max="60" required
                  value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Consultation Fee (₹)</label>
                <input type="number" className="form-input form-input-number" placeholder="500"
                  value={form.consultationFee} onChange={e => setForm({ ...form, consultationFee: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hospital Name *</label>
              <input type="text" className="form-input" placeholder="AIIMS Delhi" required
                value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input type="text" className="form-input" placeholder="Delhi" required
                  value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input type="text" className="form-input" placeholder="Delhi" required
                  value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">About / Bio</label>
              <textarea className="form-input" rows={3} placeholder="Brief description about your expertise..."
                value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} style={{ resize: 'vertical' }} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" style={{ padding: '14px' }} disabled={loading}>
              {loading ? <><div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Submitting...</> : 'Submit for Approval'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Already approved?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
