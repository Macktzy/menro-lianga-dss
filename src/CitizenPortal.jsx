import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './CitizenPortal.css';
import { useToast } from './ui/toast/ToastProvider.jsx';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const dumpTruckIcon = L.divIcon({
  className: '',
  iconSize: [46, 46],
  iconAnchor: [23, 23],
  popupAnchor: [0, -28],
  html: '<div class="truck-marker-icon">🚛</div>',
});

const Icons = {
  Map: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  Alert: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Guide: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Camera: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  LogOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Settings: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
};

const barangayList = [
  "Anibongan", "Banahao", "Ban-as", "Baucawe", "Diatagon", "Ganayon",
  "Liatimco", "Manyayay", "Payasan", "Poblacion", "Saint Christine", "San Isidro", "San Pedro"
];

// Helper: Convert File to base64 data URL (fallback when storage fails)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Helper: Compress and resize image for better quality balance
const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with good quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const CitizenPortal = ({ session }) => {
  const toast = useToast();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const userEmail = session?.user?.email || 'citizen@lianga.gov.ph';

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('citizen_active_tab') || 'schedule');
  const [trucks, setTrucks] = useState([]);
  
  const [selectedBgySchedule, setSelectedBgySchedule] = useState(() => localStorage.getItem('menro_citizen_bgy') || '');
  const [geoStatus, setGeoStatus] = useState({ state: 'idle', message: '' }); // idle|locating|detected|denied|error
  const [geoLocation, setGeoLocation] = useState(null); // [lat,lng]
  const [liveSchedules, setLiveSchedules] = useState([]);

  const [report, setReport] = useState(() => {
    const draft = JSON.parse(sessionStorage.getItem('citizen_report_draft') || 'null');
    const savedPhoto = sessionStorage.getItem('citizen_report_photo');
    return {
      type: draft?.type || 'Missed Collection',
      barangay: draft?.barangay || '',
      purok: draft?.purok || '',
      desc: draft?.desc || '',
      photo: savedPhoto || null,
      photoFile: null, // File objects can't survive page reload; upload uses base64 directly
    };
  });
  const [submitting, setSubmitting] = useState(false);
  
  const [myReports, setMyReports] = useState(() => {
    const saved = localStorage.getItem('menro_citizen_reports');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('menro_citizen_reports', JSON.stringify(myReports)); }, [myReports]);
  useEffect(() => {
    if (selectedBgySchedule) localStorage.setItem('menro_citizen_bgy', selectedBgySchedule);
  }, [selectedBgySchedule]);
  // Android resilience: persist active tab so resume lands on the same screen
  useEffect(() => { sessionStorage.setItem('citizen_active_tab', activeTab); }, [activeTab]);
  // Android resilience: auto-save text fields so they survive camera-intent page reloads
  useEffect(() => {
    sessionStorage.setItem('citizen_report_draft', JSON.stringify({
      type: report.type, barangay: report.barangay, purok: report.purok, desc: report.desc,
    }));
  }, [report.type, report.barangay, report.purok, report.desc]);

  useEffect(() => {
    const fetchSchedules = async () => {
      const { data } = await supabase.from('barangay_schedules').select('*');
      if (data) setLiveSchedules(data);
    };
    fetchSchedules();
  }, []);

  const normalizeText = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s-]/g, '')
      .trim();

  const detectBarangayFromCoords = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const json = await res.json();
    const addr = json?.address || {};

    const candidates = [
      addr.village,
      addr.suburb,
      addr.hamlet,
      addr.neighbourhood,
      addr.city_district,
      addr.city,
      addr.municipality,
      json?.name,
      json?.display_name,
    ]
      .filter(Boolean)
      .map(normalizeText)
      .filter(Boolean);

    for (const bgy of barangayList) {
      const nb = normalizeText(bgy);
      if (candidates.some((c) => c === nb || c.includes(nb) || nb.includes(c))) return bgy;
    }

    const tokens = new Set(candidates.flatMap((c) => c.split(/\s+/g)).filter(Boolean));
    for (const bgy of barangayList) {
      const nb = normalizeText(bgy);
      if (tokens.has(nb)) return bgy;
    }

    return '';
  };

  const requestGeoBarangay = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus({ state: 'error', message: 'GPS not supported on this device.' });
      return;
    }

    setGeoStatus({ state: 'locating', message: 'Detecting your barangay using GPS…' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoLocation([latitude, longitude]);
        try {
          const detected = await detectBarangayFromCoords(latitude, longitude);
          if (detected) {
            setSelectedBgySchedule(detected);
            setGeoStatus({ state: 'detected', message: `Detected: ${detected}` });
          } else {
            setGeoStatus({ state: 'error', message: 'Could not detect barangay. Please select manually.' });
          }
        } catch (e) {
          setGeoStatus({ state: 'error', message: 'Location detected, but barangay lookup failed. Please select manually.' });
        }
      },
      (err) => {
        if (err?.code === 1) setGeoStatus({ state: 'denied', message: 'Location permission denied. Please select barangay manually.' });
        else setGeoStatus({ state: 'error', message: 'Could not get GPS location. Please select barangay manually.' });
      },
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 12000 }
    );
  };

  useEffect(() => {
    if (!selectedBgySchedule) requestGeoBarangay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchTrucks = async () => {
      const { data } = await supabase.from('drivers').select('lat, lng, email');
      setTrucks(data || []);
    };
    fetchTrucks();
    const interval = setInterval(fetchTrucks, 10000);
    return () => clearInterval(interval);
  }, []);

  const myReportsRef = useRef(myReports);
  useEffect(() => { myReportsRef.current = myReports; }, [myReports]);

  useEffect(() => {
    const checkReportStatus = async () => {
      const current = myReportsRef.current;
      if (current.length === 0) return;
      const ids = current.map(r => r.id).filter(Boolean);
      if (ids.length === 0) return;

      const { data } = await supabase.from('citizen_reports').select('id, is_verified').in('id', ids);
      if (data) {
        const updatedReports = current.map(localReport => {
          const dbReport = data.find(db => db.id === localReport.id);
          if (dbReport && dbReport.is_verified) return { ...localReport, status: 'Resolved' };
          return localReport;
        });
        const hasChanges = updatedReports.some((r, i) => r.status !== current[i].status);
        if (hasChanges) setMyReports(updatedReports);
      }
    };
    checkReportStatus();
    const interval = setInterval(checkReportStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Use FileReader (base64) instead of createObjectURL — blob URLs die when Android
    // suspends the PWA tab; base64 dataURLs survive and can be stored in sessionStorage.
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      sessionStorage.setItem('citizen_report_photo', dataUrl);
      setReport(prev => ({ ...prev, photo: dataUrl, photoFile: file }));
    };
    reader.readAsDataURL(file);
  };

  const getLiveCoords = () =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve({ lat: 8.625, lng: 126.09 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(geoLocation ? { lat: geoLocation[0], lng: geoLocation[1] } : { lat: 8.625, lng: 126.09 }),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
      );
    });

  const handleSubmitReport = async () => {
    if (!report.barangay || !report.purok) {
      toast.show({ variant: 'error', title: 'Missing Info', message: 'Please select your Barangay and enter your Purok.' });
      return;
    }
    // Accept restored base64 photo (Android resume) even when photoFile object is gone
    if (!report.photoFile && !report.photo) {
      toast.show({ variant: 'error', title: 'Photo Required', message: 'Please attach photo evidence before submitting.' });
      return;
    }
    setSubmitting(true);
    const { lat, lng } = await getLiveCoords();
    const fullLocation = `${report.barangay}, ${report.purok}`;

    // Upload photo evidence (best-effort). We store the public URL inside `description`
    // so Admin can display it without requiring schema changes.
    // Android resume: photoFile is null but base64 photo was restored from sessionStorage
    let photoUrl = report.photoFile ? '' : (report.photo || '');
    if (!report.photoFile && report.photo) console.log('Android resume: using sessionStorage-restored base64 photo.');
    if (report.photoFile) try {
      const safeEmail = (userEmail || 'citizen').replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = report.photoFile.name?.split('.').pop() || 'jpg';
      const path = `${safeEmail}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('incident_evidence').upload(path, report.photoFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: report.photoFile.type || 'image/jpeg',
      });
      if (upErr) {
        console.error('Storage upload error:', upErr);
        // Fallback: compress and convert to base64 data URL if storage fails
        if (report.photoFile && report.photoFile instanceof File) {
          try {
            const compressed = await compressImage(report.photoFile, 1600, 1600, 0.9);
            if (compressed) {
              photoUrl = compressed;
              console.log('Using compressed base64 fallback, length:', compressed.length);
              toast.show({ variant: 'info', title: 'Photo Attached', message: 'Image embedded in report (storage unavailable).' });
            }
          } catch (compressErr) {
            console.error('Image compression failed:', compressErr);
            // Try raw base64 as last resort
            try {
              const base64 = await fileToBase64(report.photoFile);
              photoUrl = base64;
              toast.show({ variant: 'info', title: 'Photo Attached', message: 'Image embedded (uncompressed).' });
            } catch (base64Err) {
              console.error('Base64 conversion also failed:', base64Err);
              toast.show({ variant: 'warning', title: 'Photo Not Attached', message: 'Report will be sent without photo.' });
            }
          }
        } else {
          console.error('No valid photoFile for base64 conversion');
          toast.show({ variant: 'warning', title: 'Photo Error', message: 'Invalid photo file.' });
        }
      } else {
        const { data: pub } = supabase.storage.from('incident_evidence').getPublicUrl(path);
        photoUrl = pub?.publicUrl || '';
        console.log('Photo uploaded successfully:', photoUrl);
      }
    } catch (e) {
      console.error('Photo upload exception:', e);
      // Fallback: compress and convert to base64
      if (report.photoFile && report.photoFile instanceof File) {
        try {
          const compressed = await compressImage(report.photoFile, 1600, 1600, 0.9);
          if (compressed) {
            photoUrl = compressed;
            console.log('Using compressed fallback after exception, length:', compressed.length);
            toast.show({ variant: 'info', title: 'Photo Attached', message: 'Image embedded in report (storage error).' });
          }
        } catch (e2) {
          console.error('Compression also failed:', e2);
          toast.show({ variant: 'warning', title: 'Photo Not Attached', message: 'Report will be sent without photo due to error.' });
        }
      } else {
        console.error('No valid photoFile for exception fallback');
      }
    }

    const finalDesc = `${(report.desc || '').trim()}${photoUrl ? `\n\nPHOTO_URL: ${photoUrl}` : ''}`.trim();

    const { data, error } = await supabase
      .from('citizen_reports')
      .insert([
        {
          report_type: report.type,
          barangay: report.barangay,
          purok: fullLocation,
          description: finalDesc,
          is_verified: false,
          lat,
          lng,
        },
      ])
      .select();

    setSubmitting(false);

    if (!error && data) {
      toast.show({ variant: 'success', title: 'Report Sent', message: 'MENRO Command Center has received your alert.' });
      const newReport = { id: data[0].id, type: report.type, location: fullLocation, date: new Date().toLocaleDateString(), status: 'Pending' };
      setMyReports([newReport, ...myReports]);
      sessionStorage.removeItem('citizen_report_draft');
      sessionStorage.removeItem('citizen_report_photo');
      setReport({ type: 'Missed Collection', barangay: '', purok: '', desc: '', photo: null, photoFile: null });
    } else {
      toast.show({ variant: 'error', title: 'Error', message: 'Could not send report. Check connection.' });
    }
  };

  const getCollectionSchedule = (bgy) => {
    const found = liveSchedules.find(s => s.barangay === bgy);
    return found ? found.collection_days : "Processing schedule...";
  };

  return (
    <div className="cp-root">
      
      <header className="cp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="cp-title">Lianga E-WACS</h1>
          <p className="cp-subtitle">Citizen Engagement Portal</p>
        </div>
        
        <div className="cp-avatar-container">
          <button className="cp-avatar-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            {userEmail.charAt(0).toUpperCase()}
          </button>
          
          {showProfileMenu && (
            <div className="cp-profile-menu">
              <div className="cp-profile-header">
                <strong>Citizen Profile</strong>
                <span>{userEmail}</span>
              </div>
              <div className="cp-menu-item" onClick={() => { setShowProfileMenu(false); toast.show({ variant: 'info', title: 'Profile', message: 'Account settings coming soon.' }); }}>
                <Icons.Guide /> My Information
              </div>
              
              {/* NEW SETTINGS BUTTON */}
              <div className="cp-menu-item" onClick={() => { setShowProfileMenu(false); toast.show({ variant: 'info', title: 'Settings', message: 'App settings coming soon.' }); }}>
                <Icons.Settings /> Settings
              </div>

              <div className="cp-menu-item danger" onClick={() => supabase.auth.signOut()}>
                <Icons.LogOut /> Log Out
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="cp-content">
        
        {activeTab === 'schedule' && (
          <div className="cp-fade-in">
            <h2 className="cp-section-title">My Collection Schedule</h2>
            
            <div className="cp-card" style={{ marginBottom: '20px' }}>
              <div className="cp-field">
                <div className="cp-label">Your Barangay (Auto-detected)</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="cp-input" style={{ display: 'flex', alignItems: 'center', minHeight: '44px', flex: 1 }}>
                    {selectedBgySchedule || (geoStatus.state === 'locating' ? 'Detecting…' : 'Not detected')}
                  </div>
                  <button
                    type="button"
                    className="cp-btn-primary"
                    onClick={requestGeoBarangay}
                    style={{ width: 'auto', padding: '10px 14px' }}
                  >
                    Use my location
                  </button>
                </div>
                {geoStatus.message && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: geoStatus.state === 'detected' ? '#0f766e' : '#6b7280' }}>
                    {geoStatus.message}
                  </div>
                )}
              </div>

              {(!selectedBgySchedule || geoStatus.state === 'denied' || geoStatus.state === 'error') && (
                <div className="cp-field" style={{ marginTop: '14px' }}>
                  <div className="cp-label">Manual Select (Fallback)</div>
                  <select className="cp-input" value={selectedBgySchedule} onChange={(e) => setSelectedBgySchedule(e.target.value)}>
                    <option value="">-- Choose Barangay --</option>
                    {barangayList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              {selectedBgySchedule && (
                <div className="cp-schedule-result">
                  <div className="schedule-days">{getCollectionSchedule(selectedBgySchedule)}</div>
                  <div className="schedule-subtext">Ensure waste is segregated properly before collection.</div>
                </div>
              )}
            </div>

            <h2 className="cp-section-title">Live Truck Tracking</h2>
            <div className="cp-map-wrap">
              <MapContainer center={[8.6294, 126.0945]} zoom={14} style={{ height: '100%', width: '100%', background: '#1a1a2e' }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri' />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>' />
                {trucks.map((t, i) => t.lat && (
                  <Marker key={i} position={[t.lat, t.lng]} icon={dumpTruckIcon}>
                    <Popup>MENRO Collection Truck</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="cp-schedule-info">
              <span className="cp-pulse-dot"></span>
              {trucks.length} active collection vehicle(s) nearby
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="cp-fade-in">
            <div className="cp-card" style={{ marginBottom: '24px' }}>
              <h2 className="cp-section-title" style={{ marginTop: 0 }}>Report an Issue</h2>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>Help MENRO keep Lianga clean. Alerts are sent directly to the Command Center.</p>
              
              <div className="cp-field">
                <div className="cp-label">Issue Type</div>
                <select className="cp-input" value={report.type} onChange={e => setReport({ ...report, type: e.target.value })}>
                  <option>Missed Collection</option>
                  <option>Illegal Dumping</option>
                  <option>Road Obstruction</option>
                  <option>Hazardous Waste Spill</option>
                </select>
              </div>

              <div className="cp-field-row">
                <div className="cp-field" style={{ flex: 1.5 }}>
                  <div className="cp-label">Barangay <span style={{color:'red'}}>*</span></div>
                  <select className="cp-input" value={report.barangay} onChange={e => setReport({ ...report, barangay: e.target.value })}>
                    <option value="">-- Select --</option>
                    {barangayList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="cp-field" style={{ flex: 1 }}>
                  <div className="cp-label">Purok/Zone <span style={{color:'red'}}>*</span></div>
                  <input className="cp-input" placeholder="e.g. Purok 5" value={report.purok} onChange={e => setReport({ ...report, purok: e.target.value })} />
                </div>
              </div>

              <div className="cp-field">
              <div className="cp-label">Photo Evidence <span style={{color:'red'}}>*</span></div>
                {!report.photo ? (
                  <label className="cp-photo-upload">
                    <Icons.Camera />
                    <span>Tap to take a photo</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
                  </label>
                ) : (
                  <div className="cp-photo-preview-box">
                    <img src={report.photo} alt="Evidence" />
                  <button type="button" onClick={() => { sessionStorage.removeItem('citizen_report_photo'); setReport({...report, photo: null, photoFile: null}); }}>✕ Remove</button>
                  </div>
                )}
              </div>

              <div className="cp-field">
                <div className="cp-label">Details</div>
                <textarea className="cp-textarea" placeholder="Provide any additional details..." value={report.desc} onChange={e => setReport({ ...report, desc: e.target.value })} />
              </div>

              <button type="button" className="cp-btn-primary" onClick={handleSubmitReport} disabled={submitting}>
                {submitting ? 'Transmitting...' : 'Submit to MENRO'}
              </button>
            </div>

            <h2 className="cp-section-title">My Reports Status</h2>
            {myReports.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#777', textAlign: 'center', padding: '20px' }}>You have not submitted any reports yet.</p>
            ) : (
              <div className="cp-tracker-list">
                {myReports.map((r, index) => (
                  <div key={index} className={`cp-tracker-card ${r.status === 'Resolved' ? 'resolved' : ''}`}>
                    <div className="cp-tracker-header">
                      <strong>{r.type}</strong>
                      <span className={`cp-status-badge ${r.status === 'Resolved' ? 'resolved-badge' : 'pending-badge'}`}>
                        {r.status === 'Resolved' ? <><Icons.Check/> Resolved</> : <><Icons.Clock/> Pending</>}
                      </span>
                    </div>
                    <div className="cp-tracker-loc">{r.location}</div>
                    <div className="cp-tracker-date">{r.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="cp-fade-in">
            <h2 className="cp-section-title">Segregation Guide</h2>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>Follow the National Solid Waste Management Commission (NSWMC) standard for household segregation.</p>
            
            <div className="wacs-guide-grid">
              
              <div className="wacs-guide-card bio">
                <div className="guide-icon">🌱</div>
                <h3>Biodegradable</h3>
                <p>Waste that naturally decays.</p>
                <ul>
                  <li>Food & Kitchen Scraps</li>
                  <li>Yard & Garden Waste</li>
                  <li>Agricultural Waste</li>
                </ul>
              </div>

              <div className="wacs-guide-card rec">
                <div className="guide-icon">♻️</div>
                <h3>Recyclable</h3>
                <p>Materials that can be reused.</p>
                <ul>
                  <li>Plastic Bottles (PET, HDPE)</li>
                  <li>Paper & Cartons</li>
                  <li>Glass Bottles</li>
                  <li>Tin & Aluminum Cans</li>
                </ul>
              </div>

              <div className="wacs-guide-card res">
                <div className="guide-icon">🗑️</div>
                <h3>Residual</h3>
                <p>Waste for disposal or diversion.</p>
                <ul>
                  <li>Sachets & Food Wrappers</li>
                  <li>Used Diapers & Sanitary</li>
                  <li>Soiled Paper/Plastics</li>
                  <li>Rubber & Textiles</li>
                </ul>
              </div>

              <div className="wacs-guide-card spec">
                <div className="guide-icon">⚠️</div>
                <h3>Special / Hazardous</h3>
                <p>Requires special handling.</p>
                <ul>
                  <li>Electronics (E-Waste)</li>
                  <li>Batteries & Bulbs</li>
                  <li>Chemicals & Paint</li>
                  <li>Household Healthcare</li>
                </ul>
              </div>

            </div>
          </div>
        )}

      </div>

      <nav className="cp-bottom-nav">
        <button className={`cp-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <Icons.Map /><span>Schedule</span>
        </button>
        <button className={`cp-nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
          <div className="cp-nav-alert-icon"><Icons.Alert /></div><span>Report</span>
        </button>
        <button className={`cp-nav-item ${activeTab === 'guide' ? 'active' : ''}`} onClick={() => setActiveTab('guide')}>
          <Icons.Guide /><span>Learn WACS</span>
        </button>
      </nav>

    </div>
  );
};

export default CitizenPortal;