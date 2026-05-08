import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [barangay, setBarangay] = useState('');
  const [phone, setPhone] = useState('');

  const handleOAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage({ text: error.message, type: 'error' });
  };

  const toInternalEmail = (ph) => `${ph.replace(/\D/g, '')}@citizen.menro.ph`;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isSignUp) {
        // Resolve what the user typed — phone in either field gets converted to internal email
        const emailIsPhone = email && !email.includes('@');
        const resolvedPhone = emailIsPhone ? email : phone;
        const resolvedEmail = emailIsPhone ? '' : email;

        if (!resolvedEmail && !resolvedPhone) throw new Error('Please provide an email address or phone number.');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

        const authEmail = resolvedEmail || toInternalEmail(resolvedPhone);
        const sanitizedPhone = resolvedPhone.replace(/\D/g, '');

        console.log('Sign-up authEmail:', authEmail, '| phone:', sanitizedPhone);

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: { data: { full_name: fullName, barangay, phone: sanitizedPhone } }
        });
        if (error) {
          console.error('Supabase SignUp Error:', error.message, '| Status:', error.status);
          throw error;
        }
        if (signUpData?.user) {
          const uid = signUpData.user.id;
          console.log('Linking Auth ID:', uid);
          // citizen_profiles: App.jsx Step 3 uses this for routing + phone-number login
          await supabase.from('citizen_profiles').upsert({
            id: uid, full_name: fullName,
            email: authEmail, phone_number: sanitizedPhone, barangay,
          });
        }
        setMessage({ text: 'Registration successful! Welcome to MENRO.', type: 'success' });
      } else {
        // ── Null guard ──
        const identifier = email.trim();
        if (!identifier || !password) {
          setMessage({ text: 'Please enter your email/phone and password.', type: 'error' });
          return;
        }

        // ── Step 1: Resolve identifier to an email ──
        let resolvedEmail = identifier;
        if (!identifier.includes('@')) {
          // Phone number entered — look up the registered email in citizen_profiles
          const sanitized = identifier.replace(/\D/g, '');
          console.log('Phone login — looking up citizen_profiles for:', sanitized);
          const { data: cp, error: cpError } = await supabase
            .from('citizen_profiles')
            .select('email')
            .eq('phone_number', sanitized)
            .maybeSingle();
          if (cpError) console.warn('citizen_profiles lookup error:', cpError.message);
          if (!cp?.email) throw new Error('No account found for this phone number. Please register first or log in with your email.');
          resolvedEmail = cp.email;
          console.log('Phone resolved to email:', resolvedEmail);
        }
        const authPayload = { email: resolvedEmail, password };

        // ── Step 2: Supabase Auth sign-in ──
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword(authPayload);
        if (authError) {
          console.error('Supabase Auth Error:', authError.message, '| Status:', authError.status);
          throw new Error(authError.message);
        }
        console.log('Auth success. UID:', authData.user.id, '| Email:', authData.user.email);
        setMessage({ text: 'Logging in...', type: 'success' });
        // App.jsx onAuthStateChange handles role lookup and routing
      }
    } catch (error) {
      const msg = error.status === 429 || error.message?.toLowerCase().includes('rate limit')
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : (error.message || 'An unexpected error occurred. Please try again.');
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .gov-login-root {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: url('/lianga-hall.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          font-family: 'Inter', sans-serif;
          padding: 20px;
          position: relative;
          box-sizing: border-box;
        }
        .gov-login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.52);
          pointer-events: none;
        }
        .gov-login-card {
          position: relative;
          z-index: 1;
          background: rgba(20, 30, 40, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          padding: 40px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-sizing: border-box;
          max-height: 95dvh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.15) transparent;
        }
        .gov-seal {
          font-size: 54px;
          line-height: 1;
          margin-bottom: 14px;
          display: block;
          filter: drop-shadow(0 2px 10px rgba(0,0,0,0.6));
        }
        .gov-overline {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #E3B341;
          margin: 0 0 8px;
        }
        .gov-title {
          font-size: 21px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .gov-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin: 0 0 28px;
          font-weight: 400;
          line-height: 1.5;
        }
        .gov-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent);
          margin: 0 0 28px;
        }
        .gov-input-wrap {
          margin-bottom: 22px;
          text-align: left;
        }
        .gov-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 8px;
        }
        .gov-input {
          width: 100%;
          padding: 10px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .gov-input::placeholder { color: rgba(255, 255, 255, 0.25); }
        .gov-input:focus { border-bottom-color: #E3B341; }
        .gov-select {
          width: 100%;
          padding: 10px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .gov-select option { background: #1a2535; color: #ffffff; }
        .gov-select:focus { border-bottom-color: #E3B341; }
        .gov-select-wrap { position: relative; }
        .gov-select-wrap::after {
          content: '';
          position: absolute;
          right: 4px;
          bottom: 16px;
          width: 0; height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid rgba(255,255,255,0.4);
          pointer-events: none;
        }
        .gov-input-inner {
          position: relative;
          display: flex;
          align-items: center;
        }
        .gov-input-inner .gov-input { padding-right: 32px; }
        .gov-eye-btn {
          position: absolute;
          right: 0;
          bottom: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .gov-eye-btn:hover { color: rgba(255,255,255,0.85); }
        .gov-btn {
          width: 100%;
          padding: 14px;
          margin-top: 6px;
          background: linear-gradient(135deg, #166534, #14532d);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          font-family: 'Inter', sans-serif;
        }
        .gov-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #15803d, #166534);
          border-color: #E3B341;
          box-shadow: 0 6px 24px rgba(227, 179, 65, 0.22);
          transform: translateY(-1px);
        }
        .gov-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .gov-toggle {
          margin-top: 20px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.38);
          font-size: 12px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: color 0.2s ease;
          line-height: 1.6;
        }
        .gov-toggle:hover { color: rgba(255, 255, 255, 0.75); }
        .gov-toggle span { color: #E3B341; font-weight: 600; }
        .gov-or-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 18px;
        }
        .gov-or-divider::before, .gov-or-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.12);
        }
        .gov-or-text {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          white-space: nowrap;
        }
        .gov-social-row {
          display: flex;
          gap: 12px;
        }
        .gov-social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.85);
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.5px;
        }
        .gov-social-btn:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.3);
          transform: translateY(-1px);
        }
        .gov-alert {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 20px;
          font-weight: 500;
          text-align: left;
          line-height: 1.5;
        }
        .gov-alert.error  { background: rgba(239,68,68,0.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
        .gov-alert.success { background: rgba(16,185,129,0.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.25); }
        .gov-footer {
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 9px;
          letter-spacing: 1.2px;
          color: rgba(255, 255, 255, 0.22);
          text-transform: uppercase;
          line-height: 1.8;
        }
      `}</style>

      <div className="gov-login-root">
        <div className="gov-login-card">

          <span className="gov-seal">
            <img src="/logo-192.png" alt="LGU Lianga Official Seal" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
          </span>
          <p className="gov-overline">Municipality of Lianga</p>
          <h1 className="gov-title">MENRO DSS Portal</h1>
          <p className="gov-subtitle">
            {isSignUp
              ? 'Register a new citizen account to submit reports'
              : 'Authorized access for Citizens & Fleet Operators'}
          </p>
          <div className="gov-divider"></div>

          {message.text && (
            <div className={`gov-alert ${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleAuth}>
            {isSignUp && (
              <>
                <div className="gov-input-wrap">
                  <label className="gov-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Juan dela Cruz"
                    className="gov-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="gov-input-wrap">
                  <label className="gov-label">Barangay</label>
                  <div className="gov-select-wrap">
                    <select className="gov-select" value={barangay} onChange={(e) => setBarangay(e.target.value)} required>
                      <option value="" disabled>Select your barangay</option>
                      <option>Anibongan</option>
                      <option>Ban-as</option>
                      <option>Banahao</option>
                      <option>Baucawe</option>
                      <option>Diatagon</option>
                      <option>Ganayon</option>
                      <option>Liatimco</option>
                      <option>Manyayay</option>
                      <option>Payasan</option>
                      <option>Poblacion</option>
                      <option>Saint Christine</option>
                      <option>San Isidro</option>
                      <option>San Pedro</option>
                    </select>
                  </div>
                </div>
                <div className="gov-input-wrap">
                  <label className="gov-label">Phone Number <span style={{opacity:0.45,fontWeight:400,letterSpacing:0}}>(required if no email)</span></label>
                  <input
                    type="tel"
                    placeholder="e.g. 09171234567"
                    className="gov-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="gov-input-wrap">
              <label className="gov-label">
                {isSignUp ? <>Email Address <span style={{opacity:0.45,fontWeight:400,letterSpacing:0}}>(optional if phone provided)</span></> : 'Email or Phone Number'}
              </label>
              <input
                type={isSignUp ? 'email' : 'text'}
                placeholder={isSignUp ? 'you@example.com' : 'Email or 09XXXXXXXXX'}
                className="gov-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isSignUp}
              />
            </div>
            <div className="gov-input-wrap">
              <label className="gov-label">Password</label>
              <div className="gov-input-inner">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="gov-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="gov-eye-btn" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="gov-btn" disabled={loading}>
              {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Access Portal')}
            </button>
          </form>

          <div className="gov-or-divider"><span className="gov-or-text">or continue with</span></div>
          <button type="button" className="gov-social-btn" style={{width:'100%'}} onClick={() => handleOAuth('google')}>
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            className="gov-toggle"
            onClick={() => { setIsSignUp(s => !s); setMessage({ text: '', type: '' }); setFullName(''); setBarangay(''); setPhone(''); }}
          >
            {isSignUp ? (
              <>Already have an account? <span>Sign In</span></>
            ) : (
              <>Don&apos;t have an account? <span>Register</span></>
            )}
          </button>

          <div className="gov-footer">
            Republic of the Philippines · Surigao del Sur<br />
            Municipal Environment &amp; Natural Resources Office
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;