import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { Star, MapPin, Clock, Search, Filter, ArrowRight } from 'lucide-react';

export default function DoctorSuggestion() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [selectedSpec, setSelectedSpec] = useState(searchParams.get('specialization') || '');
  const predictionId = searchParams.get('predictionId');

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpec]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSpec) params.append('specialization', selectedSpec);
      if (search) params.append('search', search);
      const res = await api.get(`/doctors?${params}`);
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const specializations = ['', 'Cardiologist', 'Hepatologist', 'Neurologist', 'General Physician', 'Other'];
  const specColors = { Cardiologist: '#ef4444', Hepatologist: '#f59e0b', Neurologist: '#8b5cf6', 'General Physician': '#84CC16' };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title">Find Doctors</h1>
          <p className="page-subtitle">Browse and book appointments with specialized doctors</p>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-input" placeholder="Search by name or hospital..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '42px' }} />
          </form>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {specializations.map(spec => (
              <button key={spec || 'all'} onClick={() => setSelectedSpec(spec)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  background: selectedSpec === spec ? (specColors[spec] || 'var(--accent)') : 'transparent',
                  color: selectedSpec === spec ? 'white' : 'var(--text-secondary)',
                  borderColor: selectedSpec === spec ? (specColors[spec] || 'var(--accent)') : 'var(--border)',
                  fontFamily: 'Outfit'
                }}>
                {spec || 'All Specializations'}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestion Banner */}
        {predictionId && selectedSpec && (
          <div className="alert alert-info" style={{ marginBottom: '24px' }}>
            🎯 Showing <strong>{selectedSpec}s</strong> recommended based on your prediction results
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
            <p>Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '60px' }}>👨‍⚕️</span>
            <h3 style={{ fontFamily: 'Outfit', marginTop: '20px', color: 'var(--text-secondary)' }}>No doctors found</h3>
            <p style={{ marginTop: '8px' }}>Try changing filters or search terms</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {doctors.map(doctor => (
              <div key={doctor._id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: specColors[doctor.specialization] || 'var(--accent)' }} />
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '16px',
                    background: `${specColors[doctor.specialization] || '#3b82f6'}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', flexShrink: 0
                  }}>
                    {doctor.specialization === 'Cardiologist' ? '❤️' : doctor.specialization === 'Hepatologist' ? '🫀' : doctor.specialization === 'Neurologist' ? '🧠' : '👨‍⚕️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Dr. {doctor.name}
                    </h3>
                    <span style={{
                      background: `${specColors[doctor.specialization] || '#3b82f6'}15`,
                      color: specColors[doctor.specialization] || '#3b82f6',
                      padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700
                    }}>
                      {doctor.specialization}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{doctor.rating || 4.5}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <MapPin size={14} /> {doctor.hospitalName}, {doctor.city}, {doctor.state}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <Clock size={14} /> {doctor.experience} years experience
                  </div>
                </div>

                {doctor.about && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doctor.about}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Consultation Fee</div>
                    <div style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{doctor.consultationFee}
                    </div>
                  </div>
                  <Link
                    to={`/book-appointment/${doctor._id}${predictionId ? `?predictionId=${predictionId}` : ''}`}
                    className="btn btn-primary"
                  >
                    Book Appointment <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
