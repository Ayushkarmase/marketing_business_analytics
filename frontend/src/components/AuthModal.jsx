import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { X, LogIn, UserPlus, Building, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab); // 'login', 'register', 'business'
  const { currentUser } = useAuth();
  const { business, refreshDataSources } = useBusiness();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('business_owner');

  // Business form
  const [bizName, setBizName] = useState(business?.name || '');
  const [bizIndustry, setBizIndustry] = useState(business?.industry || 'fashion');
  const [bizCurrency, setBizCurrency] = useState(business?.currency || 'USD');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.login(loginEmail, loginPassword);
      setStatusMessage({ type: 'success', text: `Welcome back, ${res.user.full_name}!` });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Login failed. Please check credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.register({
        full_name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole
      });
      setStatusMessage({ type: 'success', text: 'Registration successful! You can now log in.' });
      setTimeout(() => setTab('login'), 1200);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.setupBusiness({
        name: bizName,
        industry: bizIndustry,
        currency: bizCurrency
      });
      setStatusMessage({ type: 'success', text: `Business '${res.business.name}' configured successfully!` });
      await refreshDataSources();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Business setup failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setTab('login'); setStatusMessage(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: tab === 'login' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: tab === 'login' ? '2px solid #6366f1' : '2px solid transparent'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setStatusMessage(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: tab === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: tab === 'register' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: tab === 'register' ? '2px solid #6366f1' : '2px solid transparent'
              }}
            >
              Register User
            </button>
            <button
              onClick={() => { setTab('business'); setStatusMessage(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: tab === 'business' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: tab === 'business' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: tab === 'business' ? '2px solid #6366f1' : '2px solid transparent'
              }}
            >
              Business Setup
            </button>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div style={{
            margin: '16px 20px 0',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: statusMessage.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="owner@aurora.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '6px' }}>
              <LogIn size={15} />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Default demo user: <code>owner@aurora.com</code> (role: Business Owner)
            </p>
          </form>
        )}

        {/* Tab 2: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Full Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="Jane Doe"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="jane@company.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Password</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>User Role</label>
              <select
                value={regRole}
                onChange={e => setRegRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="business_owner">Business Owner</option>
                <option value="marketing_manager">Marketing Manager</option>
                <option value="business_analyst">Business Analyst</option>
                <option value="company_admin">Company Administrator</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '6px' }}>
              <UserPlus size={15} />
              {loading ? 'Registering...' : 'Register User'}
            </button>
          </form>
        )}

        {/* Tab 3: Business Setup */}
        {tab === 'business' && (
          <form onSubmit={handleBusinessSetup} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Business Name</label>
              <input
                type="text"
                required
                value={bizName}
                onChange={e => setBizName(e.target.value)}
                placeholder="FashionHub"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Industry</label>
              <select
                value={bizIndustry}
                onChange={e => setBizIndustry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Fashion">Fashion & Apparel (PDF Real-World Example)</option>
                <option value="E-Commerce">General E-Commerce</option>
                <option value="Electronics">Consumer Electronics</option>
                <option value="Health & Beauty">Health & Beauty</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Reporting Currency</label>
              <select
                value={bizCurrency}
                onChange={e => setBizCurrency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '6px' }}>
              <Building size={15} />
              {loading ? 'Saving Setup...' : 'Save Business Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
