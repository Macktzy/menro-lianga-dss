// DriverPortal — 3-state machine: STANDBY → BRIEFING → ACTIVE ROUTE
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Driver.css';
import { useToast } from './ui/toast/ToastProvider.jsx';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const FollowTruckMap = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView(location, 16, { animate: true, duration: 1.5 });
  }, [location, map]);
  return null;
};

const BARANGAY_COORDINATES = {
  'manyayay':       [8.684319, 126.155396],
  'diatagon':       [8.676839,  126.137215],
  'saint christine':[8.669305,  126.127930],
  'ganayon':        [8.654001,  126.109454],
  'san isidro':     [8.675617,  126.075781],
  'banahao':        [8.649223,  126.088598],
  'ban-as':         [8.639030,  126.091685],
  'poblacion':      [8.632099,  126.091579],
  'payasan':        [8.620401,  126.077811],
  'baucawe':        [8.598371,  126.090222],
  'anibongan':      [8.583217,  126.099334],
  'liatimco':       [8.570634,  126.109643],
  'san pedro':      [8.630626,  126.048386],
};

const DUMPSITE_COORDS = [8.6150, 126.0900];

const getCheckpointCoords = (checkpoint) => {
  const raw = checkpoint.trim();
  if (raw.toLowerCase().includes('dumpsite') || raw.toLowerCase().includes('return to municipal')) {
    return DUMPSITE_COORDS;
  }
  const clean = raw
    .replace(/^\[\d+\]\s*/, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim()
    .toLowerCase();
  return BARANGAY_COORDINATES[clean] || null;
};

const hazardIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
  html: `<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6))"><svg width="34" height="34" viewBox="0 0 24 24" fill="#ef4444" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`,
});

// --- PROFESSIONAL SVG ICONS ---
const Icons = {
  Alert: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Map: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  History: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Stats: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Truck: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Radar: () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>,
  Camera: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
};

const DriverPortal = ({ session }) => {
  const driverEmail = session.user.email;
  const storedUser = JSON.parse(localStorage.getItem('menro_user') || '{}');
  const operatorName = storedUser.full_name || driverEmail.split('@')[0].toUpperCase();
  const assignedFleet = storedUser.assigned_fleet || 'Unassigned';
  const toast = useToast();

  const [mission, setMission] = useState(null);
  const [completedStops, setCompletedStops] = useState([]);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingReports, setPendingReports] = useState([]);

  // --- 1. PERSISTENT MOBILE STATE (Prevents camera/tab-switching crashes) ---
  const [stinkCleared, setStinkCleared] = useState(() => localStorage.getItem('driver_stink') === 'true');
  const [isReportModalOpen, setIsReportModalOpen] = useState(() => localStorage.getItem('driver_modal') === 'true');
  
  const [reportForm, setReportForm] = useState(() => {
    const savedForm = localStorage.getItem('driver_report_form');
    return savedForm ? JSON.parse(savedForm) : { type: 'Excess Volume', notes: '' };
  });
  
  const [photoPreview, setPhotoPreview] = useState(() => localStorage.getItem('driver_photo') || null);

  // --- 2. AUTO-SAVE HOOKS ---
  useEffect(() => { localStorage.setItem('driver_stink', stinkCleared); }, [stinkCleared]);
  useEffect(() => { localStorage.setItem('driver_modal', isReportModalOpen); }, [isReportModalOpen]);
  useEffect(() => { localStorage.setItem('driver_report_form', JSON.stringify(reportForm)); }, [reportForm]);
  useEffect(() => { 
    if (photoPreview) localStorage.setItem('driver_photo', photoPreview); 
    else localStorage.removeItem('driver_photo'); 
  }, [photoPreview]);
  // 1. OFFLINE ENGINE: Detect Network Changes & Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Background Sync Function
  const syncOfflineData = async () => {
    const queue = JSON.parse(localStorage.getItem('menro_offline_queue')) || [];
    if (queue.length === 0) return;

    toast.show({ variant: 'info', title: 'Connection Restored', message: `Syncing ${queue.length} offline actions...` });

    for (let action of queue) {
      if (action.type === 'LOG_WAYPOINT') {
        await supabase.from('collection_logs').insert([{ driver_email: driverEmail, location: action.payload, weight_collected_kg: 0 }]);
      } else if (action.type === 'HAZARD_REPORT') {
        await supabase.from('citizen_reports').insert([action.payload]);
      }
    }
    
    localStorage.removeItem('menro_offline_queue');
    toast.show({ variant: 'success', title: 'Sync Complete', message: 'All field data uploaded.' });
  };

  // Safe queuing function
  const addToOfflineQueue = (action) => {
    const queue = JSON.parse(localStorage.getItem('menro_offline_queue')) || [];
    queue.push(action);
    localStorage.setItem('menro_offline_queue', JSON.stringify(queue));
    toast.show({ variant: 'info', title: 'Saved Offline', message: 'Action saved locally. Will sync when online.' });
  };

  // Derive schedule days from total trip count
  const getScheduleDays = (trips) => {
    const map = {
      1: ['Monday'],
      2: ['Monday', 'Thursday'],
      3: ['Monday', 'Wednesday', 'Friday'],
      4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      5: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    };
    return map[trips] || Array.from({ length: trips }, (_, i) => ['Mon','Tue','Wed','Thu','Fri','Sat'][i] || `Day ${i + 1}`);
  };

  const fetchMission = useCallback(async () => {
    const { data } = await supabase
      .from('driver_assignments')
      .select('*')
      .eq('driver_email', driverEmail)
      .eq('is_completed', false)
      .order('assigned_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    setMission(prev => {
      if (data) {
        const step = (data.current_step === null || data.current_step === undefined) ? -1 : data.current_step;
        const savedShift = Math.max(
          parseInt(localStorage.getItem(`driver_shift_${data.id}`) || '1'),
          (data.trips_completed || 0) + 1
        );
        if (!prev || prev.id !== data.id) {
          const saved = JSON.parse(localStorage.getItem(`driver_completed_${data.id}`) || '[]');
          setCompletedStops(saved);
          setShowBriefing(step === -1 || (saved.length === 0 && savedShift > 1));
        }
        return data;
      }
      return null;
    });
  }, [driverEmail]);

  useEffect(() => {
    fetchMission();
    const interval = setInterval(fetchMission, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from('citizen_reports')
        .select('id, barangay, purok, description, lat, lng')
        .eq('is_verified', false);
      if (data) setPendingReports(data);
    };
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentLocation([latitude, longitude]);
          if (!isOffline && driverEmail) {
            const { error: gpsErr } = await supabase
              .from('drivers')
              .update({ lat: latitude, lng: longitude })
              .eq('email', driverEmail);
            if (gpsErr) console.error('GPS location update failed:', gpsErr.message, '| driver:', driverEmail);
          }
        },
        (err) => console.warn('GPS Error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [driverEmail, isOffline]);

  const handleStartRoute = async () => {
    if (!isOffline) {
      await supabase.from('driver_assignments').update({ current_step: 0 }).eq('id', mission.id);
    }
    setCompletedStops([]);
    setShowBriefing(false);
  };

  const handleMarkDone = async (waypointName, idx) => {
    if (isOffline) {
      addToOfflineQueue({ type: 'LOG_WAYPOINT', payload: waypointName });
    } else {
      await supabase.from('collection_logs').insert([{ driver_email: driverEmail, location: waypointName, weight_collected_kg: 0 }]);
    }

    const newCompleted = [...completedStops, idx];
    setCompletedStops(newCompleted);
    localStorage.setItem(`driver_completed_${mission.id}`, JSON.stringify(newCompleted));

    const tripsTagMatch = mission.route_name?.match(/\[TRIPS:\s*(\d+)\]/);
    const totalTrips = tripsTagMatch ? parseInt(tripsTagMatch[1]) : (mission.trips_total || 3);
    const currentShift = Math.max(
      parseInt(localStorage.getItem(`driver_shift_${mission.id}`) || '1'),
      (mission.trips_completed || 0) + 1
    );

    if (newCompleted.length >= mission.checkpoints.length) {
      if (currentShift < totalTrips) {
        // Day done — more shifts remaining, reset to briefing
        if (!isOffline) {
          await supabase.from('driver_assignments').update({ current_step: 0, trips_completed: currentShift }).eq('id', mission.id);
        }
        localStorage.setItem(`driver_shift_${mission.id}`, String(currentShift + 1));
        localStorage.removeItem(`driver_completed_${mission.id}`);
        toast.show({ variant: 'success', title: `Day ${currentShift} Route Complete!`, message: `Shift ${currentShift}/${totalTrips} logged. See you next collection day!` });
        setCompletedStops([]);
        setShowBriefing(true);
      } else {
        // Final shift done — weekly mission complete
        if (!isOffline) {
          await supabase.from('driver_assignments').update({ is_completed: true, current_step: newCompleted.length }).eq('id', mission.id);
        }
        localStorage.removeItem(`driver_shift_${mission.id}`);
        localStorage.removeItem(`driver_completed_${mission.id}`);
        toast.show({ variant: 'success', title: 'Weekly Mission Accomplished!', message: `All ${totalTrips} trips done. Outstanding work, operator.` });
        setMission(null);
      }
    } else {
      if (!isOffline) await supabase.from('driver_assignments').update({ current_step: newCompleted.length }).eq('id', mission.id);
    }
    setStinkCleared(false);
  };

  // 2. CAMERA ENGINE: Native capture logic
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      localStorage.setItem('driver_photo', dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSendReport = async () => {
    if (!reportForm.notes) {
      toast.show({ variant: 'error', title: 'Missing details', message: 'Please provide a brief description.' });
      return;
    }

    // In a real production app, we upload 'photoPreview' base64 to Supabase Storage here.
    const payload = { 
      report_type: `DRIVER ALERT: ${reportForm.type}`, 
      purok: reportForm.notes + (photoPreview ? " [📸 Photo Attached]" : ""), 
      is_verified: false 
    };

    if (isOffline) {
      addToOfflineQueue({ type: 'HAZARD_REPORT', payload });
      setIsReportModalOpen(false);
      setReportForm({ type: 'Excess Volume', notes: '' });
      setPhotoPreview(null);
    } else {
      const { error } = await supabase.from('citizen_reports').insert([payload]);
      if (!error) {
        toast.show({ variant: 'success', title: 'Alert Broadcasted', message: 'Command Center has been notified.' });
        setIsReportModalOpen(false);
        setReportForm({ type: 'Excess Volume', notes: '' });
        setPhotoPreview(null);
      } else {
        toast.show({ variant: 'error', title: 'Transmission Failed', message: 'Could not reach Command Center.' });
      }
    }
  };

  // ── STANDBY: No active assignment ──
  if (!mission) {
    return (
      <div className="driver-pwa-container standby-screen">
        {isOffline && <div className="offline-banner">⚠️ OFFLINE MODE: Data saving locally</div>}
        <header className="pwa-header standby-header" style={{ top: isOffline ? '40px' : '0' }}>
          <div>
            <h2 className="header-title">MENRO Fleet</h2>
            <div className="gps-status-container">
              <div className={`gps-dot ${currentLocation ? 'active' : 'searching'}`}></div>
              <p className="gps-status-text">{currentLocation ? 'GPS Locked' : 'Searching GPS...'}</p>
            </div>
          </div>
          <div className="avatar-container">
            <div className="profile-avatar-btn" onClick={() => setShowMenu(!showMenu)}>{operatorName.charAt(0)}</div>
            <div className="avatar-status" style={{ background: '#E3B341' }}></div>
            {showMenu && (
              <div className="avatar-menu">
                <div className="avatar-menu-header">
                  <strong className="avatar-menu-name">{operatorName}</strong>
                  <span className="avatar-menu-email">{driverEmail}</span>
                </div>
                <div className="avatar-menu-item" onClick={() => toast.show({ variant: 'info', title: 'Info', message: 'Vehicle settings coming soon.' })}>
                  <Icons.Truck /> Vehicle Info
                </div>
                <div className="avatar-menu-item danger" onClick={() => supabase.auth.signOut()}>
                  <Icons.LogOut /> Log Out
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="standby-center">
          <div className={`radar-scanner ${currentLocation ? 'locked' : ''}`}><Icons.Radar /></div>
          <h1 className="operator-name">{operatorName}</h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent-neon, #10b981)', textTransform: 'uppercase', opacity: 0.85 }}>{assignedFleet}</p>
          <p className="standby-text">STANDBY MODE</p>
          <div className="awaiting-dispatch-box">Awaiting Dispatch...</div>
        </div>
      </div>
    );
  }

  // Derive mission metadata (parsed from route_name tags with fallback defaults)
  const crewMatch = mission.route_name?.match(/\[CREW:\s*(\d+)\]/);
  const tripsTagMatch = mission.route_name?.match(/\[TRIPS:\s*(\d+)\]/);
  const totalCrew = crewMatch ? parseInt(crewMatch[1]) : 9;
  const totalTrips = tripsTagMatch ? parseInt(tripsTagMatch[1]) : (mission.trips_total || 3);
  const tripsCompleted = mission.trips_completed || 0;
  const dailyCrew = Math.ceil(totalCrew / totalTrips);
  const currentShift = Math.max(
    parseInt(localStorage.getItem(`driver_shift_${mission.id}`) || '1'),
    tripsCompleted + 1
  );
  const currentTripNum = currentShift;
  const cleanRouteName = mission.route_name
    ?.replace(/\s*\[CREW:.*?\]/g, '')
    .replace(/\s*\[TRIPS:.*?\]/g, '')
    .trim();
  const scheduleDays = getScheduleDays(totalTrips);

  // ── BRIEFING: Mission assigned, waiting for driver to START ──
  if (showBriefing) {
    return (
      <div className="driver-pwa-container standby-screen briefing-light">
        {isOffline && <div className="offline-banner">⚠️ OFFLINE MODE: Data saving locally</div>}
        <header className="pwa-header standby-header" style={{ top: isOffline ? '40px' : '0' }}>
          <div>
            <h2 className="header-title">MENRO Fleet</h2>
            <div className="gps-status-container">
              <div className={`gps-dot ${currentLocation ? 'active' : 'searching'}`}></div>
              <p className="gps-status-text">{currentLocation ? 'GPS Locked' : 'Searching GPS...'}</p>
            </div>
          </div>
          <div className="avatar-container">
            <div className="profile-avatar-btn" onClick={() => setShowMenu(!showMenu)}>{operatorName.charAt(0)}</div>
            <div className="avatar-status"></div>
            {showMenu && (
              <div className="avatar-menu">
                <div className="avatar-menu-header">
                  <strong className="avatar-menu-name">{operatorName}</strong>
                  <span className="avatar-menu-email">{driverEmail}</span>
                </div>
                <div className="avatar-menu-item" onClick={() => toast.show({ variant: 'info', title: 'Info', message: 'Vehicle settings coming soon.' })}>
                  <Icons.Truck /> Vehicle Info
                </div>
                <div className="avatar-menu-item danger" onClick={() => supabase.auth.signOut()}>
                  <Icons.LogOut /> Log Out
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="standby-center" style={{ padding: '24px', justifyContent: 'flex-start', paddingTop: '80px' }}>

          {/* Mission Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '6px 14px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '20px', fontSize: '12px', fontWeight: 800, color: '#059669', letterSpacing: '0.8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}></div>
            ACTIVE WEEKLY MISSION
          </div>

          {/* Route Name */}
          <div style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Mission Briefing</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', lineHeight: 1.3, marginBottom: '16px' }}>
              {cleanRouteName}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Total Weekly Load</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>{totalTrips}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>truckload{totalTrips !== 1 ? 's' : ''} this week</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Total Assigned Crew</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#7c3aed' }}>{totalCrew}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{dailyCrew} required today</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Collection Schedule</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {scheduleDays.map((day, i) => (
                  <span key={day} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, background: i < tripsCompleted ? 'rgba(16,185,129,0.2)' : i === tripsCompleted ? 'rgba(16,185,129,0.15)' : '#e2e8f0', color: i < tripsCompleted ? '#059669' : i === tripsCompleted ? '#059669' : '#475569', border: `1px solid ${i === tripsCompleted ? 'rgba(16,185,129,0.5)' : 'transparent'}` }}>
                    {i < tripsCompleted ? '\u2713 ' : ''}{day}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700 }}>Trip Progress</span>
              <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 800 }}>{tripsCompleted} / {totalTrips} Completed</span>
            </div>
          </div>

          {/* Waypoint Preview */}
          <div style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '14px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>Today&apos;s Stops ({mission.checkpoints.length})</div>
            {mission.checkpoints.slice(0, 4).map((cp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < Math.min(3, mission.checkpoints.length - 1) ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <span style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: cp.includes('HAZARD') ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: cp.includes('HAZARD') ? '#dc2626' : '#475569' }}>{i + 1}</span>
                <span style={{ fontSize: '12px', color: cp.includes('HAZARD') ? '#dc2626' : '#334155', fontWeight: cp.includes('HAZARD') ? 700 : 400, flex: 1 }}>{cp.replace(/^\[\d+\]\s*/, '')}</span>
              </div>
            ))}
            {mission.checkpoints.length > 4 && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>+{mission.checkpoints.length - 4} more stops</div>}
          </div>

          {/* START BUTTON */}
          <button
            className="btn-mark-done"
            style={{ width: '100%', padding: '18px', fontSize: '16px', fontWeight: 900, letterSpacing: '0.5px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
            onClick={handleStartRoute}
          >
            ➤ START TODAY&apos;S ROUTE ({currentTripNum}/{totalTrips})
          </button>
        </div>
      </div>
    );
  }

  const mapFallbackCenter = [8.632099, 126.091579];
  const progressPercent = (completedStops.length / mission.checkpoints.length) * 100;

  const firstUncompletedIdx = mission.checkpoints.findIndex((_, i) => !completedStops.includes(i));
  const activeCheckpoint = firstUncompletedIdx >= 0 ? mission.checkpoints[firstUncompletedIdx] : '';
  const activeCleanName = activeCheckpoint
    .replace(/^\[\d+\]\s*/, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim()
    .toLowerCase();
  const activeTargetCoords = activeCleanName ? (BARANGAY_COORDINATES[activeCleanName] || getCheckpointCoords(activeCheckpoint)) : null;

  return (
    <div className="driver-pwa-container">
      {isOffline && <div className="offline-banner">⚠️ OFFLINE MODE: Data saving locally</div>}
      
      <div className="scroll-body" style={{ marginTop: isOffline ? '30px' : '0' }}>
        <div className="map-viewport">
          <div className="live-route-badge">
            <div className="dot" style={{ background: isOffline ? '#EAB308' : '#00FF66' }}></div> 
            {isOffline ? 'GPS SAVING LOCALLY' : (currentLocation ? 'TRACKING LIVE' : 'AWAITING GPS')}
          </div>
          
          <MapContainer center={currentLocation || mapFallbackCenter} zoom={15} style={{ height: '100%', width: '100%', background: '#000' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            {currentLocation && <Marker position={currentLocation}><Popup>TRK-01 (You)</Popup></Marker>}
            <FollowTruckMap location={currentLocation} />
            {currentLocation && activeTargetCoords && (
              <Polyline positions={[currentLocation, activeTargetCoords]} color="#3b82f6" weight={5} dashArray="10, 10" opacity={0.8} />
            )}
            {mission.checkpoints.map((cp, i) => {
              if (completedStops.includes(i)) return null;
              const cleanLabel = cp.replace(/^\[\d+\]\s*/, '').replace(/\s*\[.*?\]/g, '').trim();
              const isHazard = cp.toLowerCase().includes('hazard');
              const coords = getCheckpointCoords(cp);

              const labelMarker = coords ? (
                <Marker
                  key={`label-${i}`}
                  position={coords}
                  icon={L.divIcon({
                    className: 'menro-map-label',
                    html: `<span>${cleanLabel.toUpperCase()}</span>`,
                    iconSize: [100, 20],
                    iconAnchor: [50, 10],
                  })}
                />
              ) : null;

              if (isHazard) {
                const match = pendingReports.find(
                  (r) => r.barangay && cleanLabel.toLowerCase().includes(r.barangay.toLowerCase()) && r.lat && r.lng
                );
                if (match) {
                  const purokDisplay = match.purok || match.barangay;
                  const descSnippet = (match.description || '').split('\n')[0].replace(/PHOTO_URL:.*$/i, '').trim().slice(0, 80);
                  return (
                    <React.Fragment key={i}>
                      <Marker position={[match.lat, match.lng]} icon={hazardIcon}>
                        <Popup>⚠️ Hazard in {purokDisplay}{descSnippet ? `: ${descSnippet}` : ''}</Popup>
                      </Marker>
                      {labelMarker}
                    </React.Fragment>
                  );
                }
              }

              if (!coords) return null;
              return (
                <React.Fragment key={i}>
                  <Marker position={coords}>
                    <Popup>{cleanLabel}</Popup>
                  </Marker>
                  {labelMarker}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        <div className="ui-overlay">
        <header className="pwa-header">
          <div>
            <h1 style={{ fontSize: '15px', marginBottom: '2px' }}>{cleanRouteName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontSize: '12px' }}>Shift {currentTripNum}/{totalTrips} · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#8b5cf6', background: 'rgba(139,92,246,0.15)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.4)', whiteSpace: 'nowrap' }}>Crew: {dailyCrew} Personnel</span>
            </div>
          </div>
          <div className="avatar-container">
            <div className="profile-avatar-btn" onClick={() => setShowMenu(!showMenu)}>{operatorName.charAt(0)}</div>
            <div className="avatar-status"></div>
            
            {showMenu && (
              <div className="avatar-menu">
                <div className="avatar-menu-header">
                  <strong className="avatar-menu-name">{operatorName}</strong>
                  <span className="avatar-menu-email">{driverEmail}</span>
                </div>
                <div className="avatar-menu-item" onClick={() => toast.show({ variant: 'info', title: 'Info', message: 'Vehicle settings coming soon.' })}>
                  <Icons.Truck /> Vehicle Info
                </div>
                <div className="avatar-menu-item danger" onClick={() => supabase.auth.signOut()}>
                  <Icons.LogOut /> Log Out
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="progress-container">
          <div className="progress-text">
            <span>Route Progress</span>
            <span className="highlight">{completedStops.length} / {mission.checkpoints.length} STOPS DONE</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="section-label">WAYPOINTS</div>

        <div>
          {mission.checkpoints.map((checkpoint, idx) => {
            const isUrgent = checkpoint.toLowerCase().includes('report') || checkpoint.toLowerCase().includes('clean');
            const isCompleted = completedStops.includes(idx);
            const isActive = !isCompleted;
            const isNextUp = idx === firstUncompletedIdx;

            return (
              <React.Fragment key={idx}>
                {isUrgent && isNextUp && (
                  <div className="waypoint-card urgent">
                    <div className="wp-icon"><Icons.Alert /></div>
                    <div className="wp-content">
                      <div className="wp-title">Citizen Report at location</div>
                      <div className="wp-sub">Clear area to proceed</div>
                    </div>
                    <div className="wp-action">
                      <input type="checkbox" className="custom-checkbox" checked={stinkCleared} onChange={(e) => setStinkCleared(e.target.checked)} />
                    </div>
                  </div>
                )}

                <div className={`waypoint-card ${isNextUp ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="wp-icon">
                    {isCompleted ? <Icons.Check /> : <div className="wp-dot"></div>}
                  </div>
                  <div className="wp-content">
                    <div className="wp-title">{checkpoint}</div>
                    {isCompleted && <div className="wp-sub">Completed Stop</div>}
                    {isNextUp && !isCompleted && <div className="wp-sub">Active Destination</div>}
                    {isActive && !isNextUp && <div className="wp-sub">Upcoming Stop</div>}
                  </div>
                  <div className="wp-action">
                    {isCompleted && <span className="done-text">Done</span>}
                    {isActive && (
                      <button className="btn-mark-done" onClick={() => handleMarkDone(checkpoint, idx)} disabled={isUrgent && isNextUp && !stinkCleared}>
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        </div>
      </div>

      {isReportModalOpen && (
        <>
          <div className="mobile-modal-overlay" onClick={() => setIsReportModalOpen(false)}></div>
          <div className="mobile-modal">
            <div className="modal-drag-handle"></div>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--state-danger)' }}>Report Field Hazard</h3>
            
            <label className="modal-label">INCIDENT TYPE</label>
            <select className="mobile-input" value={reportForm.type} onChange={e => setReportForm({...reportForm, type: e.target.value})}>
              <option value="Excess Volume">Excess Volume (Needs backup)</option>
              <option value="Road Blocked">Road Blocked / Unpassable</option>
              <option value="Vehicle Breakdown">Vehicle Breakdown</option>
            </select>

            <label className="modal-label" style={{ marginTop: '16px' }}>LOCATION / NOTES</label>
            <textarea 
              className="mobile-input" 
              placeholder="E.g., Stuck near Banahao bridge..." 
              rows="2"
              value={reportForm.notes}
              onChange={e => setReportForm({...reportForm, notes: e.target.value})}
            />

            {/* --- NATIVE CAMERA INTEGRATION --- */}
            <div style={{ marginTop: '16px' }}>
              {!photoPreview ? (
                <label className="camera-btn">
                  <Icons.Camera /> Take Proof Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
                </label>
              ) : (
                <div className="photo-preview-container">
                  <img src={photoPreview} alt="Proof" className="photo-preview" />
                  <button className="remove-photo-btn" onClick={() => setPhotoPreview(null)}>✕ Retake</button>
                </div>
              )}
            </div>

            <button type="button" className="btn-mark-done" style={{ background: 'var(--state-danger)', marginTop: '24px', width: '100%' }} onClick={handleSendReport}>
              Transmit Alert {isOffline && '(Save Offline)'}
            </button>
          </div>
        </>
      )}

      <nav className="bottom-nav">
        <div className="nav-item active">
          <Icons.Map />
          <span>Route</span>
        </div>
        <div className="nav-item" onClick={() => toast.show({ variant: 'info', title: 'History', message: 'Coming soon.' })}>
          <Icons.History />
          <span>History</span>
        </div>
        <div className="nav-item" onClick={() => toast.show({ variant: 'info', title: 'Stats', message: 'Coming soon.' })}>
          <Icons.Stats />
          <span>Stats</span>
        </div>
        <div className="nav-item report-btn" onClick={() => setIsReportModalOpen(true)}>
          <Icons.Alert />
          <span>Report</span>
        </div>
      </nav>

    </div>
  );
};

export default DriverPortal;