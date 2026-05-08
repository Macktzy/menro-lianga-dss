import React, { useMemo, useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from './supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Admin.css';
import { useToast } from './ui/toast/ToastProvider.jsx';
import { useConfirm } from './ui/modal/useConfirm.jsx';

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

const RecenterMap = ({ drivers }) => {
  const map = useMap();
  useEffect(() => {
    if (drivers.length > 0 && drivers[0].lat) map.setView([drivers[0].lat, drivers[0].lng], 14);
  }, [drivers, map]);
  return null;
};

const Icons = {
  Matrix: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  Map: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  Forecasting: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Profiling: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h8"/><path d="m4.93 19.07 1.41-1.41"/><path d="M12 22v-8"/><path d="m19.07 19.07-1.41-1.41"/><path d="M22 12h-8"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.93 15.93A5 5 0 0 0 8.07 8.07"/><path d="M12 12V2"/></svg>,
  Export: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Brain: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  // Incident Details Icons
  FileText: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  Camera: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  MapPin: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  AlertTriangle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Circle:     () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg>,
  Truck:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Users:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  User:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Flame:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  History:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>,
  Moon:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  LogOut:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Settings:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  X:          () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ArrowRight: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Plus:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  IdCard:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 9h4M14 12h4M14 15h2"/></svg>,
};

const InputCell = ({ label, stateKey, type = "number", placeholder = "0.00", textOnly = false, formData, setFormData }) => {
  const handleChange = (e) => {
    let val = e.target.value;
    if (textOnly) { val = val.replace(/[^a-zA-Z\sñÑ-]/g, ''); }
    setFormData(prev => ({ ...prev, [stateKey]: val }));
  };

  return (
    <div className="wacs-input-cell">
      <label>{label}</label>
      <input 
        type={type} className="form-input" step={type === "number" ? "0.01" : undefined} min={type === "number" ? "0" : undefined} 
        placeholder={placeholder} value={formData[stateKey] || ''} onChange={handleChange} required
      />
    </div>
  );
};

const Dashboard = ({ session }) => {
  const adminEmail = session.user?.email || "admin@menro.gov.ph";
  const toast = useToast();
  const { confirm, ConfirmModal } = useConfirm();
  const TRUCK_CAPACITY = 4000; 
  const WASTE_DENSITY = 300;
  const TRUCK_LIMIT = 10;

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('admin_tab') || 'matrix');
  
  const [assignmentForm, setAssignmentForm] = useState(() => {
    const savedForm = localStorage.getItem('menro_dispatch_form');
    return savedForm ? JSON.parse(savedForm) : { driver_email: '', route_name: '', trips: '', personnel: '', checkpoints: '' };
  });

  const [manifestData, setManifestData] = useState(null);
  const [aiPrepared, setAiPrepared] = useState(null); // { key: 'batch1'|'batch2', name: string }
  const [aiRemainingBatchKeys, setAiRemainingBatchKeys] = useState([]); // e.g. ['batch2']
  const [dispatchedBatches, setDispatchedBatches] = useState([]); // tracks 'batch1' | 'batch2' dispatched this session

  // --- DRIVER MANAGEMENT STATE ---
  const [driverProfiles, setDriverProfiles] = useState([]);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({ full_name: '', email: '', password: '', contact_number: '', license_number: '', assigned_fleet: 'Unassigned' });
  const [driverFormError, setDriverFormError] = useState('');
  const [editingDriverId, setEditingDriverId] = useState(null);

  const [wacsHouseholds, setWacsHouseholds] = useState([]);
  const [wacsRecords, setWacsRecords] = useState([]);
  
  const [dbSchedules, setDbSchedules] = useState([]);
  const [editedSchedules, setEditedSchedules] = useState({});

  const [wacsSession, setWacsSession] = useState(() => {
    const saved = localStorage.getItem('menro_wacs_session');
    return saved ? JSON.parse(saved) : { active: false, barangay: '', target: 0, current: 0 };
  });
  
  const [completedBarangays, setCompletedBarangays] = useState(() => {
    const saved = localStorage.getItem('menro_completed_bgy');
    return saved ? JSON.parse(saved) : [];
  });

  const initialFormState = {
    family_name: '', adults_count: '', children_count: '', income_level: 'Middle',
    day_2_total: '', day_3_total: '', 
    bio_food: '', bio_garden: '', bio_agri: '', bio_livestock: '',
    rec_pap_white: '', rec_pap_news: '', rec_pap_carton: '', rec_pap_mixed: '', rec_pap_bev: '',
    rec_pla_pet: '', rec_pla_hdpe: '', rec_pla_pvc: '', rec_pla_ldpe: '', rec_pla_pp: '', rec_pla_ps: '', rec_pla_others: '',
    rec_gls_bottles: '', rec_gls_flat: '', rec_gls_cullet: '',
    rec_met_tin: '', rec_met_alum: '', rec_met_steel: '', rec_met_copper: '',
    res_div_grocery: '', res_div_pouches: '', res_div_straws: '', res_div_tarps: '', res_div_leather: '', res_div_rubber: '', res_div_textile: '', res_div_others: '',
    res_disp_sanitary: '', res_disp_soiledpap: '', res_disp_soiledpla: '', res_disp_cigs: '', res_disp_others: '',
    spec_weee: '', spec_hh_health: '', spec_lighting: '', spec_chemical: '', spec_hosp_health: '',
    spec_bulky_yard: '', spec_bulky_const: '', spec_bulky_tires: ''
  };

  const [savedSessions, setSavedSessions] = useState(() => {
    const saved = localStorage.getItem('menro_wacs_saved_sessions');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentWacsDay, setCurrentWacsDay] = useState(1);
  const [dailyTotals, setDailyTotals] = useState({ day1: 0, day2: 0, day3: 0 });
  const [accumulatedWacs, setAccumulatedWacs] = useState(initialFormState);
  const [wacsDetailedForm, setWacsDetailedForm] = useState(initialFormState);

  const [logs, setLogs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [historyReports, setHistoryReports] = useState([]); 
  const [predictions, setPredictions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(null); // Used to display Priority Alerts in Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const [telemetryFilter, setTelemetryFilter] = useState('All');
  const [telemetryDateFilter, setTelemetryDateFilter] = useState(''); 
  const [incidentFilter, setIncidentFilter] = useState('All');
  const [incidentHistoryDate, setIncidentHistoryDate] = useState('');
  const [viewingHistory, setViewingHistory] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => { localStorage.setItem('admin_tab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('menro_dispatch_form', JSON.stringify(assignmentForm)); }, [assignmentForm]);
  useEffect(() => { localStorage.setItem('menro_wacs_session', JSON.stringify(wacsSession)); }, [wacsSession]);
  useEffect(() => { localStorage.setItem('menro_completed_bgy', JSON.stringify(completedBarangays)); }, [completedBarangays]);
  useEffect(() => { localStorage.setItem('menro_wacs_saved_sessions', JSON.stringify(savedSessions)); }, [savedSessions]);

  useEffect(() => {
    if (wacsSession.active && wacsSession.barangay) {
      const timer = setTimeout(() => {
        setSavedSessions(prev => ({
          ...prev, [wacsSession.barangay]: { target: wacsSession.target, current: wacsSession.current, currentWacsDay, wacsDetailedForm, dailyTotals, accumulatedWacs }
        }));
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [wacsSession, currentWacsDay, wacsDetailedForm, dailyTotals, accumulatedWacs]);

  const barangayList = [
    "Anibongan", "Banahao", "Ban-as", "Baucawe", "Diatagon", "Ganayon", 
    "Liatimco", "Manyayay", "Payasan", "Poblacion", "Saint Christine", "San Isidro", "San Pedro"
  ];

  const weeklyTrends = [
    { day: 'Mon', predicted: 1200, actual: 1150 }, { day: 'Tue', predicted: 850, actual: 880 }, { day: 'Wed', predicted: 1400, actual: 1390 }, { day: 'Thu', predicted: 900, actual: 950 }, { day: 'Fri', predicted: 1600, actual: 1580 },
  ];

  const fetchAllData = async () => {
    const { data: pred } = await supabase
      .from('predictions')
      .select('*')
      .order('id', { ascending: false })
      .limit(13);

    const { data: drv } = await supabase.from('drivers').select('*');
    const { data: rpt } = await supabase.from('citizen_reports').select('*').order('created_at', { ascending: false });
    const { data: lg } = await supabase.from('collection_logs').select('*').order('completed_at', { ascending: false }).limit(50);
    const { data: hh } = await supabase.from('wacs_households').select('*').order('family_name', { ascending: true });
    const { data: rec } = await supabase.from('wacs_waste_records').select('*, wacs_households(family_name)').order('submitted_at', { ascending: false });
    const { data: sched } = await supabase.from('barangay_schedules').select('*');

    setPredictions(pred || []);
    setDrivers(drv || []);
    setDriverProfiles(drv || []);
    if (rpt) { setPendingReports(rpt.filter(r => !r.is_verified)); setHistoryReports(rpt.filter(r => r.is_verified)); } else { setPendingReports([]); setHistoryReports([]); }
    setLogs(lg || []);
    setWacsHouseholds(hh || []);
    setWacsRecords(rec || []);
    
    if (sched) {
      setDbSchedules(sched);
      const initialEdits = {};
      barangayList.forEach(b => {
        const found = sched.find(s => s.barangay === b);
        initialEdits[b] = found ? found.collection_days : '';
      });
      setEditedSchedules(initialEdits);
    }
  };

  useEffect(() => {
    fetchAllData(); 
    if (isOffline) return;

    const logsSubscription = supabase.channel('custom-insert-channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'collection_logs' }, payload => {
        setLogs(currentLogs => [payload.new, ...currentLogs].slice(0, 50));
        toast.show({ variant: 'success', title: 'Live Telemetry', message: `Driver cleared: ${payload.new.location}` });
      }).subscribe();

    const reportsSubscription = supabase.channel('custom-reports-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_reports' }, payload => {
        fetchAllData(); 
        if (payload.event === 'INSERT') toast.show({ variant: 'error', title: 'Urgent Alert', message: 'New citizen incident reported.' });
      }).subscribe();

    // Live driver GPS: Realtime subscription catches instant updates when Realtime is
    // enabled for the drivers table in Supabase. The 10-second poll is a fallback.
    const driversSubscription = supabase.channel('driver-location-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers' }, payload => {
        setDrivers(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d));
      })
      .subscribe();

    const driverLocationPoll = setInterval(async () => {
      const { data: drv } = await supabase.from('drivers').select('*');
      if (drv) setDrivers(drv);
    }, 10000);

    return () => {
      supabase.removeChannel(logsSubscription);
      supabase.removeChannel(reportsSubscription);
      supabase.removeChannel(driversSubscription);
      clearInterval(driverLocationPoll);
    };
  }, [isOffline]);

  useEffect(() => {
    if (predictions.length > 0) {
      const urgencyList = predictions.map((p, index) => {
        const cleanBarangayName = p.barangay_name.toLowerCase().trim();
        const matchedReports = pendingReports.filter(r => {
          if (!r.purok) return false;
          const cleanReportInput = r.purok.toLowerCase().trim();
          return cleanReportInput.includes(cleanBarangayName) || cleanBarangayName.includes(cleanReportInput);
        });
        const score = p.predicted_volume_kg + (matchedReports.length * 2000);
        const specificLocations = matchedReports.map(r => r.purok).join(", ");
        return { ...p, urgencyScore: score, reportCount: matchedReports.length, reportedPuroks: specificLocations };
      });
      const priorityNode = urgencyList.sort((a, b) => b.urgencyScore - a.urgencyScore)[0];
      setAiSuggestion(priorityNode);
    }
  }, [predictions, pendingReports]);

  // Generate the AI Analytics Payload for the Modal
  const getAiAnalytics = () => {
    if (predictions.length === 0) return null;
    
    const batch1North = ["Ban-As","Banahao","San Isidro", "Ganayon", "Saint Christine", "Diatagon", "Manyayay"];
    const batch2South = ["Poblacion", "Payasan", "San Pedro", "Baucawe", "Anibongan", "Liatimco"];
    
    let b1Total = 0; let b2Total = 0;
    predictions.forEach(p => {
      if (batch1North.includes(p.barangay_name)) b1Total += p.predicted_volume_kg;
      if (batch2South.includes(p.barangay_name)) b2Total += p.predicted_volume_kg;
    });

    const b1Trips = Math.ceil((b1Total / WASTE_DENSITY) / TRUCK_LIMIT) || 1;
    const b2Trips = Math.ceil((b2Total / WASTE_DENSITY) / TRUCK_LIMIT) || 1;

    return {
      batch1: {
        name: "Batch 1 (North Sweep)",
        volume: b1Total, trips: b1Trips, weeklyStaff: b1Trips * 3,
        dailySplit: Math.ceil((b1Trips * 3) / 3), // Mon/Wed/Fri Split
        nodes: predictions.filter(p => batch1North.includes(p.barangay_name)).sort((a,b) => b.predicted_volume_kg - a.predicted_volume_kg)
      },
      batch2: {
        name: "Batch 2 (South Sweep)",
        volume: b2Total, trips: b2Trips, weeklyStaff: b2Trips * 3,
        dailySplit: Math.ceil((b2Trips * 3) / 3), // Tue/Thu/Sat Split
        nodes: predictions.filter(p => batch2South.includes(p.barangay_name)).sort((a,b) => b.predicted_volume_kg - a.predicted_volume_kg)
      }
    };
  };

  const analytics = useMemo(() => getAiAnalytics(), [predictions]); // stable reference for helpers

  const buildRoutineText = ({ isHighRisk, issues }) => {
    if (issues?.length > 0) return `Respond to ${issues.length} report(s), clear obstruction before pickup`;
    if (isHighRisk) return `Full-truck expected; prioritize early pickup + bring extra sacks`;
    return `Standard collection; verify segregation + log tonnage`;
  };

  const applyAiToForm = (batchKey, batchData) => {
    if (!batchData) return;

    const checkpoints = [];
    batchData.nodes.forEach((bgy, index) => {
      const issues = pendingReports.filter(r => r.barangay === bgy.barangay_name);
      checkpoints.push(`[${index + 1}] ${bgy.barangay_name}${issues.length > 0 ? ' [HAZARD REPORTED]' : ''}`);
    });
    checkpoints.push('Return to Municipal Dumpsite');

    setAssignmentForm({
      driver_email: '',
      route_name: `${batchData.name} [CREW: ${batchData.weeklyStaff}] [TRIPS: ${batchData.trips}]`,
      trips: String(batchData.trips),
      personnel: String(batchData.weeklyStaff),
      checkpoints: checkpoints.join(', '),
    });
    setAiPrepared({ key: batchKey, name: batchData.name });
    if (batchKey === 'batch1') setAiRemainingBatchKeys(['batch2']);
    if (batchKey === 'batch2') setAiRemainingBatchKeys([]);

    toast.show({ variant: 'success', title: 'Loaded to Dispatch', message: `${batchData.name} queued. Assign an operator and Execute.` });
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignmentForm.driver_email) return toast.show({ variant: 'error', title: 'Missing Operator', message: 'You must assign a driver to this route.' });

    const tripsTag = assignmentForm.trips ? ` [TRIPS: ${parseInt(assignmentForm.trips)}]` : '';
    const baseWithTrips = assignmentForm.route_name.includes('[TRIPS:') ? assignmentForm.route_name : `${assignmentForm.route_name}${tripsTag}`;
    const finalRouteName = assignmentForm.personnel
      ? baseWithTrips.replace(/\[CREW:\s*\d+\]/, `[CREW: ${assignmentForm.personnel}]`)
      : baseWithTrips;
    const { error } = await supabase.from('driver_assignments').insert([{
      driver_email: assignmentForm.driver_email,
      route_name: finalRouteName,
      checkpoints: assignmentForm.checkpoints.split(',').map(i => i.trim()),
      is_completed: false,
      current_step: -1,
      trips_total: parseInt(assignmentForm.trips) || 1,
      trips_completed: 0,
    }]);
    if (error) return toast.show({ variant: 'error', title: 'Dispatch failed', message: error.message || 'Please try again.' });

    const justCompleted = aiPrepared?.key;
    const newDispatched = [...dispatchedBatches, justCompleted].filter(Boolean);
    setDispatchedBatches(newDispatched);

    setAssignmentForm({ driver_email: '', route_name: '', trips: '', personnel: '', checkpoints: '' });
    setManifestData(null);
    setAiPrepared(null);
    setAiRemainingBatchKeys([]);

    if (justCompleted === 'batch1') {
      toast.show({ variant: 'success', title: 'North Route Dispatched', message: 'North Route (Banahao/Diatagon) is now active in the Driver App. Start South Route when ready.' });
    } else if (justCompleted === 'batch2') {
      const allDone = newDispatched.includes('batch1') && newDispatched.includes('batch2');
      toast.show({
        variant: 'success',
        title: allDone ? 'All Routes Deployed' : 'South Route Dispatched',
        message: allDone ? 'Both North & South routes are now active in the field.' : 'South Route (Poblacion/Payasan) dispatched to Driver App.',
      });
    } else {
      toast.show({ variant: 'success', title: 'Dispatch Executed', message: 'Route synced to fleet network.' });
    }
  };
  
  const handleVerifyReport = async (id, approve) => { if (approve) { const { error } = await supabase.from('citizen_reports').update({ is_verified: true }).eq('id', id); if (!error) toast.show({ variant: 'success', title: 'Verified', message: 'Report approved.' }); fetchAllData(); } else { const ok = await confirm('Delete report?', 'This will permanently remove the citizen report.'); if (!ok) return; const { error } = await supabase.from('citizen_reports').delete().eq('id', id); if (!error) toast.show({ variant: 'success', title: 'Deleted', message: 'Report removed.' }); fetchAllData(); } };

  const generateWeeklyReport = () => { const doc = new jsPDF(); doc.text("MENRO LIANGA: AI ALLOCATION REPORT", 105, 15, { align: "center" }); const planningData = predictions.map(p => [ p.barangay_name, `${p.predicted_volume_kg.toFixed(2)} kg`, Math.ceil(p.predicted_volume_kg / TRUCK_CAPACITY), Math.ceil(p.predicted_volume_kg / TRUCK_CAPACITY) * 4 + 1 ]); autoTable(doc, { startY: 25, head: [['Barangay', 'Forecast (Vol)', 'Trips', 'Total Staff']], body: planningData, headStyles: { fillColor: [0, 255, 136] } }); doc.save("MENRO_Intelligence_Report.pdf"); };

  const exportWacsToCSV = () => {
    if (wacsRecords.length === 0) return toast.show({ variant: 'error', title: 'No Data', message: 'No WACS records found to export.' });

    const fields = [
      { id: 'bio_food', name: 'Bio: Food' }, { id: 'bio_garden', name: 'Bio: Garden' }, { id: 'bio_agri', name: 'Bio: Agri' }, { id: 'bio_livestock', name: 'Bio: Livestock' },
      { id: 'rec_pap_white', name: 'Rec: White Paper' }, { id: 'rec_pap_news', name: 'Rec: Newspaper' }, { id: 'rec_pap_carton', name: 'Rec: Carton' }, { id: 'rec_pap_mixed', name: 'Rec: Mixed Paper' }, { id: 'rec_pap_bev', name: 'Rec: Bev Carton' },
      { id: 'rec_pla_pet', name: 'Rec: PET' }, { id: 'rec_pla_hdpe', name: 'Rec: HDPE' }, { id: 'rec_pla_pvc', name: 'Rec: PVC' }, { id: 'rec_pla_ldpe', name: 'Rec: LDPE' }, { id: 'rec_pla_pp', name: 'Rec: PP' }, { id: 'rec_pla_ps', name: 'Rec: PS' }, { id: 'rec_pla_others', name: 'Rec: Other Plastics' },
      { id: 'rec_gls_bottles', name: 'Rec: Glass Bottles' }, { id: 'rec_gls_flat', name: 'Rec: Flat Glass' }, { id: 'rec_gls_cullet', name: 'Rec: Cullets' },
      { id: 'rec_met_tin', name: 'Rec: Tin' }, { id: 'rec_met_alum', name: 'Rec: Aluminum' }, { id: 'rec_met_steel', name: 'Rec: Steel' }, { id: 'rec_met_copper', name: 'Rec: Copper' },
      { id: 'res_div_grocery', name: 'Res: Grocery Bags' }, { id: 'res_div_pouches', name: 'Res: Pouches' }, { id: 'res_div_straws', name: 'Res: Straws' }, { id: 'res_div_tarps', name: 'Res: Tarpaulins' }, { id: 'res_div_leather', name: 'Res: Leather' }, { id: 'res_div_rubber', name: 'Res: Rubber' }, { id: 'res_div_textile', name: 'Res: Textile' }, { id: 'res_div_others', name: 'Res: Other Div' },
      { id: 'res_disp_sanitary', name: 'Res: Sanitary' }, { id: 'res_disp_soiledpap', name: 'Res: Soiled Paper' }, { id: 'res_disp_soiledpla', name: 'Res: Soiled Plastic' }, { id: 'res_disp_cigs', name: 'Res: Cigarettes' }, { id: 'res_disp_others', name: 'Res: Other Disp' },
      { id: 'spec_weee', name: 'Spec: E-Waste' }, { id: 'spec_hh_health', name: 'Spec: HH Medical' }, { id: 'spec_lighting', name: 'Spec: Lighting' }, { id: 'spec_chemical', name: 'Spec: Chemicals' }, { id: 'spec_hosp_health', name: 'Spec: Hosp Medical' }, { id: 'spec_bulky_yard', name: 'Spec: Bulky Yard' }, { id: 'spec_bulky_const', name: 'Spec: Construction' }, { id: 'spec_bulky_tires', name: 'Spec: Tires' }
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Barangay,Family Name,Income Level,Adults,Children,Total Members," +
                  fields.map(f => f.name).join(",") +
                  ",TOTAL BIO,TOTAL REC,TOTAL RES,TOTAL SPEC,DAY 1 TOTAL,DAY 2 TOTAL,DAY 3 TOTAL,3-DAY GRAND TOTAL\n";

    wacsRecords.forEach(r => {
      const familyName = r.wacs_households?.family_name || 'Unknown';
      const adults = r.wacs_households?.adults_count || 0;
      const children = r.wacs_households?.children_count || 0;
      const totalPax = r.wacs_households?.total_members || 0;
      const income = r.wacs_households?.income_level || 'N/A';
      
      let details = {};
      try { details = JSON.parse(r.status); } catch(e) {}

      const detailValues = fields.map(f => details[f.id] || 0).join(",");

      const row = `${new Date(r.submitted_at).toLocaleDateString()},${r.barangay},${familyName},${income},${adults},${children},${totalPax},` +
                  `${detailValues},` +
                  `${r.total_biodegradable},${r.total_recyclable},${r.total_residual},${r.total_special},` +
                  `${r.day_1_total},${r.day_2_total},${r.day_3_total},${r.day_1_total + r.day_2_total + r.day_3_total}\n`;
      
      csvContent += row;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MENRO_WACS_Master_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.show({ variant: 'success', title: 'Export Complete', message: 'Detailed WACS Master Spreadsheet downloaded!' });
  };


  const startWacsSession = (e) => {
    e.preventDefault();
    const bgy = e.target.bgy.value;
    const target = parseInt(e.target.target.value);
    if (!bgy || target <= 0) return toast.show({ variant: 'error', title: 'Invalid Input', message: 'Select barangay and valid target.' });
    
    if (savedSessions[bgy]) {
      const s = savedSessions[bgy];
      setWacsSession({ active: true, barangay: bgy, target: s.target, current: s.current });
      setWacsDetailedForm(s.wacsDetailedForm || initialFormState);
      setAccumulatedWacs(s.accumulatedWacs || initialFormState);
      setDailyTotals(s.dailyTotals || { day1: 0, day2: 0, day3: 0 });
      setCurrentWacsDay(s.currentWacsDay || 1);
      toast.show({ variant: 'success', title: 'Session Restored', message: `Resumed ${bgy} at Household ${s.current + 1}, Day ${s.currentWacsDay || 1}` });
    } else {
      setWacsSession({ active: true, barangay: bgy, target: target, current: 0 });
      setWacsDetailedForm(initialFormState);
      setAccumulatedWacs(initialFormState);
      setDailyTotals({ day1: 0, day2: 0, day3: 0 });
      setCurrentWacsDay(1);
      toast.show({ variant: 'info', title: 'Session Initiated', message: `WACS Profiling started for ${bgy}. Target: ${target} households.` });
    }
  };

  const handleResetForm = () => {
    if (window.confirm(`Clear all detailed data for Day ${currentWacsDay}?`)) {
      setWacsDetailedForm(prev => ({ 
        ...initialFormState, 
        family_name: prev.family_name, adults_count: prev.adults_count, children_count: prev.children_count, income_level: prev.income_level 
      }));
    }
  };

  const handleSaveDraft = () => {
    setSavedSessions(prev => ({
        ...prev,
        [wacsSession.barangay]: {
          target: wacsSession.target, current: wacsSession.current, currentWacsDay, wacsDetailedForm, dailyTotals, accumulatedWacs
        }
    }));
    toast.show({ variant: 'success', title: 'Draft Saved', message: `Day ${currentWacsDay} data safely backed up.` });
  };

  const calculateDetailedSum = () => {
    const p = (val) => parseFloat(val) || 0;
    return p(wacsDetailedForm.bio_food) + p(wacsDetailedForm.bio_garden) + p(wacsDetailedForm.bio_agri) + p(wacsDetailedForm.bio_livestock) +
           p(wacsDetailedForm.rec_pap_white) + p(wacsDetailedForm.rec_pap_news) + p(wacsDetailedForm.rec_pap_carton) + p(wacsDetailedForm.rec_pap_mixed) + p(wacsDetailedForm.rec_pap_bev) +
           p(wacsDetailedForm.rec_pla_pet) + p(wacsDetailedForm.rec_pla_hdpe) + p(wacsDetailedForm.rec_pla_pvc) + p(wacsDetailedForm.rec_pla_ldpe) + p(wacsDetailedForm.rec_pla_pp) + p(wacsDetailedForm.rec_pla_ps) + p(wacsDetailedForm.rec_pla_others) +
           p(wacsDetailedForm.rec_gls_bottles) + p(wacsDetailedForm.rec_gls_flat) + p(wacsDetailedForm.rec_gls_cullet) +
           p(wacsDetailedForm.rec_met_tin) + p(wacsDetailedForm.rec_met_alum) + p(wacsDetailedForm.rec_met_steel) + p(wacsDetailedForm.rec_met_copper) +
           p(wacsDetailedForm.res_div_grocery) + p(wacsDetailedForm.res_div_pouches) + p(wacsDetailedForm.res_div_straws) + p(wacsDetailedForm.res_div_tarps) + p(wacsDetailedForm.res_div_leather) + p(wacsDetailedForm.res_div_rubber) + p(wacsDetailedForm.res_div_textile) + p(wacsDetailedForm.res_div_others) +
           p(wacsDetailedForm.res_disp_sanitary) + p(wacsDetailedForm.res_disp_soiledpap) + p(wacsDetailedForm.res_disp_soiledpla) + p(wacsDetailedForm.res_disp_cigs) + p(wacsDetailedForm.res_disp_others) +
           p(wacsDetailedForm.spec_weee) + p(wacsDetailedForm.spec_hh_health) + p(wacsDetailedForm.spec_lighting) + p(wacsDetailedForm.spec_chemical) + p(wacsDetailedForm.spec_hosp_health) + p(wacsDetailedForm.spec_bulky_yard) + p(wacsDetailedForm.spec_bulky_const) + p(wacsDetailedForm.spec_bulky_tires);
  };

  const processWacsLoop = async (e) => {
    e.preventDefault();
    const currentSum = calculateDetailedSum();
    const newAccumulated = { ...accumulatedWacs };
    
    Object.keys(initialFormState).forEach(key => {
      if (!['family_name', 'adults_count', 'children_count', 'income_level'].includes(key)) {
         newAccumulated[key] = (parseFloat(newAccumulated[key]) || 0) + (parseFloat(wacsDetailedForm[key]) || 0);
      } else {
         newAccumulated[key] = wacsDetailedForm[key]; 
      }
    });

    if (currentWacsDay === 1) {
      setDailyTotals(prev => ({ ...prev, day1: currentSum }));
      setAccumulatedWacs(newAccumulated);
      setCurrentWacsDay(2);
      setWacsDetailedForm(prev => ({ ...initialFormState, family_name: prev.family_name, adults_count: prev.adults_count, children_count: prev.children_count, income_level: prev.income_level }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.show({ variant: 'success', title: 'Day 1 Locked', message: 'Ready to receive Day 2 weights.' });
    } else if (currentWacsDay === 2) {
      setDailyTotals(prev => ({ ...prev, day2: currentSum }));
      setAccumulatedWacs(newAccumulated);
      setCurrentWacsDay(3);
      setWacsDetailedForm(prev => ({ ...initialFormState, family_name: prev.family_name, adults_count: prev.adults_count, children_count: prev.children_count, income_level: prev.income_level }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.show({ variant: 'success', title: 'Day 2 Locked', message: 'Ready to receive final Day 3 weights.' });
    } else if (currentWacsDay === 3) {
      const finalTotals = { ...dailyTotals, day3: currentSum };
      await pushHouseholdToDatabase(newAccumulated, finalTotals);
    }
  };

  const pushHouseholdToDatabase = async (finalData, finalTotals) => {
    if (isOffline) return toast.show({ variant: 'error', title: 'Offline', message: 'Reconnect to submit WACS profile.' });

    const totalMem = (parseInt(finalData.adults_count)||0) + (parseInt(finalData.children_count)||0);
    const { data: hhData, error: hhError } = await supabase.from('wacs_households')
      .insert([{ family_name: finalData.family_name, barangay: wacsSession.barangay, adults_count: finalData.adults_count, children_count: finalData.children_count, total_members: totalMem, income_level: finalData.income_level }])
      .select();

    if (hhError) return toast.show({ variant: 'error', title: 'Error', message: hhError.message });
    const hhId = hhData[0].id;

    const p = (val) => parseFloat(val) || 0;
    const bio = p(finalData.bio_food) + p(finalData.bio_garden) + p(finalData.bio_agri) + p(finalData.bio_livestock);
    const rec = p(finalData.rec_pap_white) + p(finalData.rec_pap_news) + p(finalData.rec_pap_carton) + p(finalData.rec_pap_mixed) + p(finalData.rec_pap_bev) + p(finalData.rec_pla_pet) + p(finalData.rec_pla_hdpe) + p(finalData.rec_pla_pvc) + p(finalData.rec_pla_ldpe) + p(finalData.rec_pla_pp) + p(finalData.rec_pla_ps) + p(finalData.rec_pla_others) + p(finalData.rec_gls_bottles) + p(finalData.rec_gls_flat) + p(finalData.rec_gls_cullet) + p(finalData.rec_met_tin) + p(finalData.rec_met_alum) + p(finalData.rec_met_steel) + p(finalData.rec_met_copper);
    const res = p(finalData.res_div_grocery) + p(finalData.res_div_pouches) + p(finalData.res_div_straws) + p(finalData.res_div_tarps) + p(finalData.res_div_leather) + p(finalData.res_div_rubber) + p(finalData.res_div_textile) + p(finalData.res_div_others) + p(finalData.res_disp_sanitary) + p(finalData.res_disp_soiledpap) + p(finalData.res_disp_soiledpla) + p(finalData.res_disp_cigs) + p(finalData.res_disp_others);
    const spec = p(finalData.spec_weee) + p(finalData.spec_hh_health) + p(finalData.spec_lighting) + p(finalData.spec_chemical) + p(finalData.spec_hosp_health) + p(finalData.spec_bulky_yard) + p(finalData.spec_bulky_const) + p(finalData.spec_bulky_tires);

    const detailedPayload = JSON.stringify(finalData);

    const { error: wacsError } = await supabase.from('wacs_waste_records').insert([{
      household_id: hhId, barangay: wacsSession.barangay, collected_by: adminEmail,
      total_biodegradable: bio, total_recyclable: rec, total_residual: res, total_special: spec, 
      grand_total: finalTotals.day1 + finalTotals.day2 + finalTotals.day3,
      day_1_total: finalTotals.day1, day_2_total: finalTotals.day2, day_3_total: finalTotals.day3,
      status: detailedPayload 
    }]);

    if (!wacsError) {
      toast.show({ variant: 'success', title: 'Data Logged', message: `Household ${wacsSession.current + 1} fully completed.` });
      const newCurrent = wacsSession.current + 1;
      
      if (newCurrent >= wacsSession.target) {
        setCompletedBarangays([...completedBarangays, wacsSession.barangay]);
        setSavedSessions(prev => { const next = {...prev}; delete next[wacsSession.barangay]; return next; });
        setWacsSession({ active: false, barangay: '', target: 0, current: 0 });
        toast.show({ variant: 'success', title: 'Barangay Completed!', message: `All targets met for ${wacsSession.barangay}.` });
      } else {
        setWacsSession({ ...wacsSession, current: newCurrent });
      }
      
      setWacsDetailedForm(initialFormState);
      setAccumulatedWacs(initialFormState);
      setDailyTotals({ day1: 0, day2: 0, day3: 0 });
      setCurrentWacsDay(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchAllData();
      
    } else {
      toast.show({ variant: 'error', title: 'Sync Failed', message: wacsError.message });
    }
  };

  const saveAllSchedules = async () => {
    const payload = Object.keys(editedSchedules).map(b => ({ barangay: b, collection_days: editedSchedules[b] }));
    const { error } = await supabase.from('barangay_schedules').upsert(payload);
    
    if (!error) {
      toast.show({ variant: 'success', title: 'Schedules Deployed', message: 'The Citizen App is now synced.' });
    } else {
      toast.show({ variant: 'error', title: 'Error', message: 'Failed to deploy schedules.' });
    }
  };

  // --- DRIVER MANAGEMENT HANDLERS ---
  const handleDriverFormSubmit = async (e) => {
    e.preventDefault();
    if (!driverForm.full_name || !driverForm.email) {
      setDriverFormError('Full Name and Email are required.');
      return;
    }
    if (!editingDriverId && !driverForm.password) {
      setDriverFormError('Password is required for new drivers.');
      return;
    }
    const resetModal = () => {
      setShowAddDriverModal(false);
      setEditingDriverId(null);
      setDriverForm({ full_name: '', email: '', password: '', contact_number: '', license_number: '', assigned_fleet: 'Unassigned' });
      setDriverFormError('');
    };
    if (editingDriverId) {
      const { error } = await supabase.from('drivers').update({
        full_name: driverForm.full_name,
        contact_number: driverForm.contact_number,
        license_number: driverForm.license_number,
        assigned_fleet: driverForm.assigned_fleet,
      }).eq('id', editingDriverId);
      if (error) { setDriverFormError('Failed to update: ' + error.message); return; }
      // If admin typed a new password, update it in Supabase Auth as well
      if (driverForm.password) {
        if (!supabaseAdmin) { setDriverFormError('Profile updated but password change requires VITE_SUPABASE_SERVICE_ROLE_KEY to be set on Netlify. Redeploy after adding it.'); return; }
        const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(editingDriverId, { password: driverForm.password });
        if (pwError) { setDriverFormError('Profile saved but password update failed: ' + pwError.message); return; }
      }
      setDriverProfiles(prev => prev.map(d => d.id === editingDriverId ? { ...d, ...driverForm } : d));
      setDrivers(prev => prev.map(d => d.id === editingDriverId ? { ...d, ...driverForm } : d));
      toast.show({ variant: 'success', title: 'Driver Updated', message: `${driverForm.full_name}'s profile has been updated.` });
    } else {
      // Guard: without supabaseAdmin the Auth account cannot be created — driver would never be able to log in
      if (!supabaseAdmin) {
        setDriverFormError('Cannot create driver: VITE_SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to your Netlify environment variables and redeploy the site, then try again.');
        return;
      }
      // Create Supabase Auth account so the driver can log in
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: driverForm.email,
        password: driverForm.password,
        email_confirm: true,
      });
      if (authError) { setDriverFormError('Auth Error: ' + authError.message); return; }
      const authUserId = authUser.user.id;
      console.log('Driver Auth account created. UID:', authUserId);
      const { data: inserted, error } = await supabase.from('drivers').insert([{
        id: authUserId,
        full_name: driverForm.full_name,
        email: driverForm.email,
        contact_number: driverForm.contact_number,
        license_number: driverForm.license_number,
        assigned_fleet: driverForm.assigned_fleet,
        status: 'Active',
      }]).select().single();
      if (error) { setDriverFormError('Auth account created but failed to save profile: ' + error.message); return; }
      setDriverProfiles(prev => [...prev, inserted]);
      setDrivers(prev => [...prev, inserted]);
      toast.show({ variant: 'success', title: 'Driver Registered', message: `${driverForm.full_name} has been added to the fleet roster.` });
    }
    resetModal();
  };

  const handleEditDriver = (driverId) => {
    const driver = driverProfiles.find(d => d.id === driverId);
    if (!driver) return;
    setDriverForm({
      full_name: driver.full_name,
      email: driver.email,
      password: '',
      contact_number: driver.contact_number || '',
      license_number: driver.license_number || '',
      assigned_fleet: driver.assigned_fleet || 'Unassigned',
    });
    setEditingDriverId(driverId);
    setDriverFormError('');
    setShowAddDriverModal(true);
  };

  const handleToggleDriverStatus = async (driverId) => {
    const driver = driverProfiles.find(d => d.id === driverId);
    if (!driver) return;
    const newStatus = driver.status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await supabase.from('drivers').update({ status: newStatus }).eq('id', driverId);
    if (error) { toast.show({ variant: 'error', title: 'Update Failed', message: error.message }); return; }
    setDriverProfiles(prev => prev.map(d => d.id === driverId ? { ...d, status: newStatus } : d));
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: newStatus } : d));
  };

  const DriverManagementView = () => {
    const activeCount    = driverProfiles.filter(d => d.status === 'Active').length;
    const inactiveCount  = driverProfiles.filter(d => d.status !== 'Active').length;
    const unassignedCount = driverProfiles.filter(d => d.assigned_fleet === 'Unassigned').length;

    const truckColor = (truck) => {
      if (truck === 'North Fleet') return { color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.4)' };
      if (truck === 'South Fleet') return { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)' };
      return { color: 'var(--text-secondary)', bg: 'var(--glass-bg)', border: 'var(--border-dim)' };
    };

    return (
      <>
        {/* ── SERVICE KEY STATUS BANNER ── */}
        {!supabaseAdmin && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#ef4444', fontWeight: 700, fontSize: '13px' }}>
            ⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY is NOT loaded. Driver accounts cannot be created until you: (1) add it in Netlify → Site Configuration → Environment Variables, (2) trigger a new deploy.
          </div>
        )}
        {supabaseAdmin && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
            ✓ Service key is active — driver Auth accounts will be created on registration.
          </div>
        )}
        {/* ── STAT ROW ── */}
        <div className="stat-grid">
          <div className="stat-widget">
            <div className="stat-label">Total Drivers</div>
            <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{driverProfiles.length}</div>
          </div>
          <div className="stat-widget" style={{ borderTopColor: 'var(--accent-neon)' }}>
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{ color: 'var(--accent-neon)' }}>{activeCount}</div>
          </div>
          <div className="stat-widget" style={{ borderTopColor: 'var(--danger)' }}>
            <div className="stat-label">On Leave / Inactive</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{inactiveCount}</div>
          </div>
          <div className="stat-widget" style={{ borderTopColor: 'var(--accent-purple)' }}>
            <div className="stat-label">Unassigned</div>
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{unassignedCount}</div>
          </div>
        </div>

        {/* ── FLEET ROSTER CARD ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="card-title" style={{ margin: '0 0 4px 0' }}>Fleet Roster</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                All registered garbage collection operators and drivers.
              </p>
            </div>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}
              onClick={() => { setDriverFormError(''); setEditingDriverId(null); setDriverForm({ full_name: '', email: '', password: '', contact_number: '', license_number: '', assigned_fleet: 'Unassigned' }); setShowAddDriverModal(true); }}
            >
              <Icons.Plus /> Add New Driver
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Contact Number</th>
                  <th>License Number</th>
                  <th>Assigned Truck</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {driverProfiles.map(driver => {
                  const tc = truckColor(driver.assigned_fleet);
                  const initials = (driver.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={driver.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'var(--active-bg)', border: '1px solid var(--accent-neon)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent-neon)', fontWeight: 800, fontSize: '13px', flexShrink: 0
                          }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.3 }}>{driver.full_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{driver.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{driver.contact_number || '—'}</td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px',
                          background: 'var(--glass-bg)', border: '1px solid var(--border-dim)',
                          padding: '3px 8px', borderRadius: '4px', color: 'var(--text-primary)'
                        }}>{driver.license_number || '—'}</span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                          color: tc.color, background: tc.bg, border: `1px solid ${tc.border}`
                        }}>{driver.assigned_fleet}</span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px',
                          background: driver.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(220,38,38,0.1)',
                          color:      driver.status === 'Active' ? 'var(--accent-neon)'    : 'var(--danger)',
                          border:     driver.status === 'Active' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(220,38,38,0.3)'
                        }}>
                          {driver.status === 'Active' ? '● Active' : `◌ ${driver.status}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditDriver(driver.id)} style={{
                            background: 'var(--glass-bg)', border: '1px solid var(--border-dim)',
                            color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px'
                          }}><Icons.Edit /> Edit</button>
                          <button onClick={() => handleToggleDriverStatus(driver.id)} style={{
                            background: driver.status === 'Active' ? 'rgba(220,38,38,0.1)'        : 'rgba(16,185,129,0.1)',
                            border:     driver.status === 'Active' ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(16,185,129,0.3)',
                            color:      driver.status === 'Active' ? 'var(--danger)'              : 'var(--accent-neon)',
                            padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                          }}>{driver.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {driverProfiles.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                      No drivers registered yet. Click <strong>"Add New Driver"</strong> to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ADD DRIVER MODAL ── */}
        {showAddDriverModal && (
          <>
            <div className="mobile-modal-overlay" onClick={() => { setShowAddDriverModal(false); setDriverFormError(''); setEditingDriverId(null); }} />
            <div className="mobile-modal" style={{
              maxWidth: '560px', width: '92%', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', height: 'auto', maxHeight: '90vh',
              overflowY: 'auto', bottom: 'auto',
              background: 'var(--bg-base)', border: '1px solid var(--border-dim)',
              borderRadius: '16px', padding: '0',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)', color: 'var(--text-primary)'
            }}>
              <div style={{ height: '3px', borderRadius: '16px 16px 0 0', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-neon))' }} />

              {/* Modal Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>{editingDriverId ? 'Edit Driver' : 'Register New Driver'}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{editingDriverId ? 'Update driver information and fleet assignment.' : 'Create login credentials and assign to fleet.'}</p>
                </div>
                <button onClick={() => { setShowAddDriverModal(false); setDriverFormError(''); setEditingDriverId(null); }} style={{
                  background: 'var(--glass-bg)', border: '1px solid var(--border-dim)',
                  color: 'var(--text-secondary)', fontSize: '16px', cursor: 'pointer',
                  width: '32px', height: '32px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✕</button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleDriverFormSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {driverFormError && (
                  <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', fontWeight: 600 }}>
                    {driverFormError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Full Name *</label>
                    <input className="form-input" placeholder="e.g. Juan Dela Cruz" value={driverForm.full_name} onChange={e => setDriverForm({...driverForm, full_name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Email / Username *</label>
                    <input className="form-input" type="email" placeholder="driver@menro.gov.ph" value={driverForm.email} onChange={e => setDriverForm({...driverForm, email: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>{editingDriverId ? 'New Password (optional)' : 'Temporary Password *'}</label>
                    <input className="form-input" type="password" placeholder={editingDriverId ? 'Leave blank to keep current' : 'Min. 6 characters'} value={driverForm.password} onChange={e => setDriverForm({...driverForm, password: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Contact Number</label>
                    <input className="form-input" placeholder="09XXXXXXXXX" value={driverForm.contact_number} onChange={e => setDriverForm({...driverForm, contact_number: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>License Number</label>
                    <input className="form-input" placeholder="e.g. PD-2024-001" value={driverForm.license_number} onChange={e => setDriverForm({...driverForm, license_number: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Assigned Truck</label>
                    <select className="form-input" value={driverForm.assigned_fleet} onChange={e => setDriverForm({...driverForm, assigned_fleet: e.target.value})}>
                      <option value="Unassigned">Unassigned</option>
                      <option value="North Fleet">North Fleet</option>
                      <option value="South Fleet">South Fleet</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px', paddingTop: '14px', borderTop: '1px solid var(--border-dim)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowAddDriverModal(false); setDriverFormError(''); setEditingDriverId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Check /> {editingDriverId ? 'Update Driver' : 'Save & Register'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </>
    );
  };

  // --- VIEWS ---
  const MatrixView = () => { 
    const getFormattedDate = (isoString) => { 
      const d = new Date(isoString); 
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; 
    }; 
    
    const filteredLogs = logs.filter(log => { 
      const matchesDriver = telemetryFilter === 'All' || log.driver_email === telemetryFilter; 
      const matchesDate = !telemetryDateFilter || getFormattedDate(log.completed_at) === telemetryDateFilter; 
      return matchesDriver && matchesDate; 
    }); 
    
    const activeIncidentsList = viewingHistory ? historyReports : pendingReports; 
    const filteredIncidents = activeIncidentsList.filter(r => {
      const matchesType = incidentFilter === 'All' || r.report_type === incidentFilter;
      if (!matchesType) return false;
      if (!viewingHistory || !incidentHistoryDate) return true;
      return getFormattedDate(r.created_at) === incidentHistoryDate;
    });

    const extractPhotoUrl = (report) => {
      // Check for dedicated photo_url column first
      if (report?.photo_url) return report.photo_url;
      // Check for photo field (some versions use this)
      if (report?.photo) return report.photo;
      // Fall back to extracting from description
      const text = (report?.description || '').toString();
      // Match PHOTO_URL: prefix with any URL
      const m = text.match(/PHOTO_URL:\s*(https?:\/\/[^\s]+)/i);
      if (m) return m[1];
      // Also try matching any image URL pattern as fallback
      const imgMatch = text.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i);
      return imgMatch?.[1] || '';
    };

    const inferBarangayAndPurok = (r) => {
      const barangay = r?.barangay || '';
      if (barangay) return { barangay, purok: r?.purok || '' };
      const p = (r?.purok || '').toString();
      const found = barangayList.find((b) => p.toLowerCase().includes(b.toLowerCase()));
      return { barangay: found || '', purok: p };
    };
    
    return ( 
      <> 
        <div className="stat-grid"> 
          <div className="stat-widget"> 
            <div className="stat-label">Total Trucks</div> 
            <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{drivers.length}</div> 
          </div> 
          <div className="stat-widget" style={{ borderTopColor: 'var(--danger)' }}> 
            <div className="stat-label">Incident Queue</div> 
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{pendingReports.length}</div> 
          </div> 
          <div className="stat-widget" style={{ borderTopColor: 'var(--accent-neon)' }}> 
            <div className="stat-label">Verified Logs</div> 
            <div className="stat-value" style={{ color: 'var(--accent-neon)' }}>{logs.length}</div> 
          </div> 
          <div className="stat-widget" style={{ borderTopColor: 'var(--accent-purple)' }}> 
            <div className="stat-label">Nodes Tracked</div> 
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{predictions.length}</div> 
          </div> 
        </div> 

        <div className="content-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }}>
          <div className="card">

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: '0 0 4px 0' }}>Work Scheduling</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Configure and push route assignments to field operators.</p>
              </div>
              {analytics && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--active-bg)', border: '1px solid var(--accent-neon)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--accent-neon)', flexShrink: 0 }}>
                  <Icons.Brain /> DSS AI ACTIVE
                </div>
              )}
            </div>

            {/* ── DISPATCH FORM ── */}
            <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: analytics ? '24px' : '0' }}>
              {/* Row 1: Operator + Route Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <select required className="form-input" value={assignmentForm.driver_email} onChange={e => setAssignmentForm({...assignmentForm, driver_email: e.target.value})}>
                  <option value="">-- Assign Operator --</option>
                  {driverProfiles.filter(d => d.status === 'Active').map(driver => (
                    <option key={driver.id} value={driver.email}>{driver.full_name}</option>
                  ))}
                </select>
                <input required className="form-input" placeholder="Route Name" value={assignmentForm.route_name} onChange={e => setAssignmentForm({...assignmentForm, route_name: e.target.value})} />
              </div>
              {/* Row 2: Weekly Trips + Personnel (editable — AI pre-fills, admin can override) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Weekly Trips"
                  value={assignmentForm.trips}
                  onChange={e => setAssignmentForm({...assignmentForm, trips: e.target.value})}
                />
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Crew Required"
                  value={assignmentForm.personnel}
                  onChange={e => setAssignmentForm({...assignmentForm, personnel: e.target.value})}
                />
              </div>
              {/* Row 3: Waypoints + Execute */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input required className="form-input" style={{ flex: 1 }} placeholder="Waypoints (auto-filled or comma separated)" value={assignmentForm.checkpoints} onChange={e => setAssignmentForm({...assignmentForm, checkpoints: e.target.value})} />
                <button type="submit" className="btn btn-primary" style={{ padding: '14px 28px', whiteSpace: 'nowrap', fontWeight: 800, letterSpacing: '0.5px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>EXECUTE / PUSH <Icons.ArrowRight /></span>
                </button>
              </div>
            </form>

            {/* ── PERMANENT AI BATCH CARDS ── */}
            {analytics && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingTop: '20px', borderTop: '1px solid var(--border-dim)' }}>
                  <Icons.Brain />
                  <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>DSS AI Schedule — Weekly Dispatch Plan</span>
                  {aiPrepared && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: 'var(--state-warning)', background: 'rgba(245,158,11,0.1)', padding: '3px 9px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)' }}>
                      {aiPrepared.name} IN FORM
                    </span>
                  )}
                </div>

                {aiSuggestion && aiSuggestion.reportCount > 0 && (
                  <div className="ai-insight ai-urgent" style={{ marginBottom: '14px', padding: '10px 14px', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}><span style={{ color: '#ef4444', display: 'flex' }}><Icons.Flame /></span><strong>Priority Target: {aiSuggestion.barangay_name?.toUpperCase()}</strong> — {aiSuggestion.reportCount} critical incident(s) detected.</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { key: 'batch1', data: analytics.batch1 },
                    { key: 'batch2', data: analytics.batch2 },
                  ].map(({ key, data }) => {
                    const isLoaded = aiPrepared?.key === key;
                    return (
                      <div key={key} style={{ borderRadius: '10px', overflow: 'hidden', border: isLoaded ? '2px solid var(--accent-neon)' : '1px solid var(--border-dim)', transition: 'border-color 0.2s ease' }}>

                        {/* Card Header */}
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-dim)', background: isLoaded ? 'rgba(16,185,129,0.12)' : 'var(--glass-bg)' }}>
                          {/* Title + IN FORM badge row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: isLoaded ? '#34d399' : 'var(--text-primary)', lineHeight: '1.4' }}>{data.name}</div>
                            <div style={{ display: 'flex', gap: '5px', flexShrink: 0, marginLeft: '8px' }}>
                              {dispatchedBatches.includes(key) && !isLoaded && (
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-neon)', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>On Collection Route</span>
                              )}
                              {isLoaded && (
                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>Waiting for Schedule <Icons.Check /></span>
                              )}
                            </div>
                          </div>
                          {/* Compact stats row */}
                          <div style={{ display: 'flex', gap: '10px', marginBottom: isLoaded ? 0 : '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Truck />{data.trips} trips/wk</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Users />{data.weeklyStaff} pax</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{data.volume.toFixed(0)} kg est.</span>
                          </div>
                          {/* Batch-specific dispatch button */}
                          {!isLoaded && (
                            <button type="button" onClick={() => applyAiToForm(key, data)}
                              style={{
                                width: '100%', padding: '8px 12px', fontSize: '12px', fontWeight: 700,
                                background: key === 'batch1' ? 'rgba(37,99,235,0.15)' : 'rgba(249,115,22,0.15)',
                                color: key === 'batch1' ? '#60a5fa' : '#fb923c',
                                border: key === 'batch1' ? '1px solid rgba(37,99,235,0.5)' : '1px solid rgba(249,115,22,0.5)',
                                borderRadius: '6px', cursor: 'pointer', letterSpacing: '0.3px'
                              }}>
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {key === 'batch1' ? '↑ Start North Route (Banahao/Diatagon)' : '↓ Start South Route (Poblacion/Payasan)'}
                                <Icons.ArrowRight />
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Mini Barangay Table */}
                        <div style={{ maxHeight: '220px', overflowY: 'auto', color: 'var(--text-primary)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ background: 'var(--glass-bg)' }}>
                                <th style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', width: '36px' }}>#</th>
                                <th style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' }}>Barangay</th>
                                <th style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Est. Load</th>
                                <th style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Alerts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.nodes.map((bgy, index) => {
                                const issues = pendingReports.filter(r => r.barangay === bgy.barangay_name);
                                const isHighRisk = bgy.predicted_volume_kg > 3000;
                                return (
                                  <tr key={bgy.barangay_name} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                                    <td style={{ padding: '8px 10px' }}>
                                      <span style={{ background: index === 0 ? 'var(--danger)' : 'var(--glass-hover)', color: index === 0 ? '#fff' : 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>{index + 1}</span>
                                    </td>
                                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{bgy.barangay_name}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: isHighRisk ? 'var(--danger)' : 'var(--accent-neon)' }}>
                                      {bgy.predicted_volume_kg.toFixed(0)} kg
                                      {isHighRisk && <div style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 700 }}>FULL TRUCK</div>}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                      {issues.length > 0
                                        ? <span style={{ color: 'var(--state-warning)', fontWeight: 700 }}>⚠️ {issues.length}</span>
                                        : <span style={{ color: 'var(--state-success)' }}>✓</span>
                                      }
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="content-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}> 
          <div className="card"> 
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}> 
              <h3 className="card-title" style={{ margin: 0 }}>Real-Time Telemetry Feed</h3> 
              <div style={{ display: 'flex', gap: '8px' }}> 
                <input type="date" className="form-input date-picker-input" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }} value={telemetryDateFilter} onChange={e => setTelemetryDateFilter(e.target.value)} /> 
                <select className="form-input" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }} value={telemetryFilter} onChange={e => setTelemetryFilter(e.target.value)} > 
                  <option value="All">All Operators</option> 
                  {drivers.map(d => <option key={d.id} value={d.email}>{d.email.split('@')[0]}</option>)} 
                </select> 
              </div> 
            </div> 
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}> 
              <table className="data-table"> 
                <thead>
                  <tr>
                    <th>Waypoint</th>
                    <th>Operator</th>
                    <th>Status</th>
                  </tr>
                </thead> 
                <tbody> 
                  {filteredLogs.length === 0 ? ( 
                    <tr>
                      <td colSpan={3} style={{ color: 'var(--text-secondary)', padding: '18px' }}>No telemetry data found for this filter.</td>
                    </tr> 
                  ) : ( 
                    filteredLogs.map(log => ( 
                      <tr key={log.id}> 
                        <td style={{color: 'var(--accent-cyan)', fontWeight: 'bold'}}>{log.location}</td> 
                        <td>{log.driver_email.split('@')[0]}</td> 
                        <td style={{color: 'var(--text-secondary)'}}>{new Date(log.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</td> 
                      </tr> 
                    )) 
                  )} 
                </tbody> 
              </table> 
            </div> 
          </div> 

          <div className="card" style={{ borderTop: viewingHistory ? '4px solid var(--accent-cyan)' : '4px solid var(--danger)' }}> 
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h3 className="card-title" style={{ margin: 0, color: viewingHistory ? 'var(--accent-cyan)' : 'var(--danger)' }}> {viewingHistory ? 'Incident History' : 'Incident Queue'} </h3>
                {viewingHistory && incidentFilter !== 'All' && (
                  <span style={{
                    background: 'var(--accent-cyan)',
                    color: '#000',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    Filter: {incidentFilter}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select className="form-input" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }} value={incidentFilter} onChange={e => setIncidentFilter(e.target.value)} >
                  <option value="All">All Types</option>
                  <option value="missed collection">Missed Collection</option>
                  <option value="illegal dumping">Illegal Dumping</option>
                  <option value="road obstruction">Road Obstruction</option>
                  <option value="hazardous waste spill">Hazardous Waste Spill</option>
                </select> 
                {viewingHistory && (
                  <input
                    type="date"
                    className="form-input date-picker-input"
                    style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
                    value={incidentHistoryDate}
                    onChange={(e) => setIncidentHistoryDate(e.target.value)}
                  />
                )}
                <button onClick={() => { setViewingHistory(!viewingHistory); setIncidentFilter('All'); setIncidentHistoryDate(''); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} > 
                  {viewingHistory ? 'Back to Queue' : <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Icons.History />History</span>}
                </button> 
              </div> 
            </div> 
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}> 
              {filteredIncidents.length === 0 ? ( 
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}> 
                  {viewingHistory ? 'No resolved history found.' : 'Streets are clear. No pending incidents.'} 
                </div> 
              ) : ( 
                filteredIncidents.map(r => {
                  const photoUrl = extractPhotoUrl(r);
                  // Debug: log to console when photo URL is found
                  if (photoUrl) {
                    console.log('Found photo URL for report', r.id, ':', photoUrl.substring(0, 60) + '...');
                  }
                  return (
                    <div
                      key={r.id}
                      className={`ai-insight ${viewingHistory ? '' : 'ai-urgent'}`}
                      style={viewingHistory ? { borderLeftColor: 'var(--accent-cyan)', background: 'var(--glass-bg)', cursor: 'pointer' } : { cursor: 'pointer' }}
                      onClick={() => { console.log('Clicked incident:', r); setSelectedIncident(r); }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0}}>
                          {photoUrl ? (
                            <div style={{flexShrink: 0, width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-dim)'}}>
                              <img
                                src={photoUrl}
                                alt="Evidence"
                                style={{display: 'block', 
    maxWidth: '100%', 
    maxHeight: '450px', 
    objectFit: 'contain', 
    margin: '0 auto',
    backgroundColor: '#000'}}
                                onError={(e) => { console.error('Failed to load image:', photoUrl); e.target.style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div style={{flexShrink: 0, width: '48px', height: '48px', borderRadius: '8px', border: '1px dashed var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'}}>
                              <Icons.Camera />
                            </div>
                          )}
                          <div style={{fontSize: '13px', minWidth: 0, overflow: 'hidden'}}>
                            <div style={{fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{r.report_type}</div>
                            <div style={{color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{r.purok}</div>
                          </div>
                        </div>
                        {!viewingHistory ? (
                          <div style={{display: 'flex', gap: '8px', flexShrink: 0}}>
                            <button onClick={(e) => { e.stopPropagation(); handleVerifyReport(r.id, true); }} className="btn btn-icon btn-approve"><Icons.Check /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleVerifyReport(r.id, false); }} className="btn btn-icon btn-reject"><Icons.X /></button>
                          </div>
                        ) : (
                          <span className="ai-badge ai-badge-special" style={{flexShrink: 0}}>Verified</span>
                        )}
                      </div>
                    </div>
                  );
                }) 
              )} 
            </div> 
          </div> 
        </div> 

        {selectedIncident && (
          <>
            <div className="mobile-modal-overlay" onClick={() => setSelectedIncident(null)}></div>
            <div className="mobile-modal" style={{
              maxWidth: '680px', width: '92%', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', height: 'auto', maxHeight: '90vh',
              overflowY: 'auto', bottom: 'auto',
              background: 'var(--bg-base)',
              border: '1px solid var(--border-dim)',
              borderRadius: '16px',
              padding: '0',
              boxShadow: '0 30px 90px rgba(0,0,0,0.8)',
              color: 'var(--text-primary)'
            }}>
              {/* Top accent strip */}
              <div style={{ height: '3px', borderRadius: '16px 16px 0 0', background: 'linear-gradient(90deg, #FF4757, #00E5FF)' }} />

              {/* Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{
                        background: 'rgba(255, 71, 87, 0.2)',
                        color: '#FF6B7A',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: '1px solid rgba(255, 71, 87, 0.3)'
                      }}>
                        <Icons.AlertTriangle /> Incident Report
                      </div>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, lineHeight: 1.3 }}>
                      {selectedIncident.report_type}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    style={{
                      background: 'var(--glass-bg)', border: '1px solid var(--border-dim)',
                      color: 'var(--text-secondary)', fontSize: '16px', cursor: 'pointer',
                      width: '32px', height: '32px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease', flexShrink: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FF4757'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#FF4757'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-dim)'; }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Metadata Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-dim)' }}>
                {[
                  { label: 'Location', value: (() => { const { barangay, purok } = inferBarangayAndPurok(selectedIncident); return barangay ? `${barangay}, ${purok || '—'}` : (purok || '—'); })(), icon: <Icons.MapPin /> },
                  { label: 'Date Reported', value: selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : '—', icon: <Icons.Calendar /> }
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-surface)',
                    padding: '14px 24px',
                    borderRight: i === 0 ? '1px solid var(--border-dim)' : 'none'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: 'var(--accent-cyan)', display: 'flex' }}>{item.icon}</span> {item.label}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Body Content */}
              <div style={{ padding: '20px 24px', background: 'var(--bg-base)' }}>
                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                    <span style={{ color: 'var(--accent-cyan)', display: 'flex' }}><Icons.FileText /></span> Description
                  </div>
                  <div style={{
                    whiteSpace: 'pre-wrap', color: 'var(--text-primary)',
                    fontSize: '14px', lineHeight: 1.7,
                    background: 'var(--bg-surface)', padding: '14px 16px',
                    borderRadius: '10px', border: '1px solid var(--border-dim)'
                  }}>
                    {(() => {
                      if (!selectedIncident.description) return selectedIncident.photo_url ? '(Photo attached separately)' : '—';
                      let cleaned = selectedIncident.description.replace(/PHOTO_URL:\s*https?:\/\/[^\s]+/gi, '');
                      cleaned = cleaned.replace(/https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)/gi, '');
                      cleaned = cleaned.replace(/PHOTO_URL:\s*data:image\/[^\s]+/gi, '');
                      return cleaned.trim() || '—';
                    })()}
                  </div>
                </div>

                {/* Photo Evidence */}
                {(() => {
                  const url = extractPhotoUrl(selectedIncident);
                  return (
                    <div>
                      <div style={{
                        fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}>
                        <span style={{ color: 'var(--accent-cyan)', display: 'flex' }}><Icons.Camera /></span> Photo Evidence
                      </div>
                      {url ? (
                        <div style={{
                          borderRadius: '10px', overflow: 'hidden',
                          border: '1px solid var(--border-dim)',
                          background: 'var(--bg-base)'
                        }}>
                          <img
                            src={url}
                            alt="Evidence"
                            style={{ display: 'block', width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div style="padding:32px;text-align:center;color:#94A3B8;font-size:13px">Failed to load image</div>';
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          padding: '32px', textAlign: 'center',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-surface)',
                          borderRadius: '10px',
                          border: '1px dashed var(--border-dim)'
                        }}>
                          <div style={{ marginBottom: '8px', opacity: 0.5, display: 'flex', justifyContent: 'center' }}><Icons.Camera /></div>
                          <div style={{ fontSize: '13px' }}>No photo attached</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--border-dim)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '12px', color: 'var(--text-secondary)',
                background: 'var(--bg-surface)',
                borderRadius: '0 0 16px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#00FF66', display: 'flex' }}><Icons.Circle /></span>
                  <span style={{ fontFamily: 'monospace', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>ID {String(selectedIncident.id).slice(0, 8)}</span>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selectedIncident.is_verified
                    ? <span style={{ color: '#00FF66' }}>Verified</span>
                    : <span style={{ color: '#FF6B7A' }}>Pending Review</span>
                  }
                </div>
              </div>
            </div>
          </>
        )}

      </> 
    ); 
  };

  const TelemetryView = () => (
    <div className="card" style={{ padding: 0, height: '75vh', overflow: 'hidden' }}>
      <MapContainer center={[8.6294, 126.0945]} zoom={14} style={{ height: '75vh', width: '100%', background: '#1a1a2e' }} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri' />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>' />
        <RecenterMap drivers={drivers} />
        {drivers.map(d => d.lat && <Marker key={d.id} position={[d.lat, d.lng]} icon={dumpTruckIcon}><Popup><div style={{color: '#000'}}>{d.email}</div></Popup></Marker>)}
      </MapContainer>
    </div>
  );

  const RandomForestView = () => (
    <div className="content-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
      <div className="card" style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
        <h3 className="card-title">Forecast Nodes (Lianga)</h3>
        <div className="ai-forecast-container" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          {predictions.map((p, index) => {
            const trips = Math.ceil((p.predicted_volume_kg / WASTE_DENSITY) / TRUCK_LIMIT) || 1;
            const staff = trips * 3;
            const assignedDriver = drivers.length > 0 ? drivers[index % drivers.length].email.split('@')[0] : 'Pending';

            return (
              <div key={p.barangay_name} className="ai-insight">
                <div className="ai-loc">BARANGAY: {p.barangay_name.toUpperCase()}</div>
                <div className="ai-vol" style={{ color: 'var(--text-primary)' }}>{p.predicted_volume_kg.toFixed(1)} kg</div>
                <div className="ai-meta">
                   <span className="ai-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icons.Truck />{trips} Trips</span>
                   <span className="ai-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icons.Users />{staff} Personnel</span>
                   <span className="ai-badge ai-badge-special" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icons.User />{assignedDriver}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '75vh', overflowY: 'auto' }}>
        <div className="card">
          <h3 className="card-title">Efficiency Matrix</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)'}} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-neon)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="predicted" name="AI Target" stroke="var(--accent-cyan)" strokeWidth={3} />
                <Line type="monotone" dataKey="actual" name="Actual Yield" stroke="var(--accent-neon)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Volume Distribution</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictions.map(p => ({ name: p.barangay_name.substring(0, 5), volume: p.predicted_volume_kg }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 10}} />
                <Tooltip cursor={{fill: 'var(--glass-bg)'}} contentStyle={{ background: 'var(--bg-surface)', border: 'none', color: 'var(--text-primary)' }} />
                <Bar dataKey="volume" fill="var(--accent-neon)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const ExportView = () => (
    <div className="card" style={{ textAlign: 'center', padding: '100px 20px' }}>
       <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '10px' }}>Data Export Node</h2>
       <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Finalize operational and strategic records into formal documentation.</p>
       
       <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
         <div className="stat-widget" style={{ padding: '30px', maxWidth: '320px', borderTopColor: 'var(--accent-neon)' }}>
           <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>AI Routing Report</h3>
           <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Generates a PDF daily routing schedule based on the Random Forest volume forecasts.</p>
           <button onClick={generateWeeklyReport} className="btn btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Icons.Download /> Download PDF
           </button>
         </div>

         <div className="stat-widget" style={{ padding: '30px', maxWidth: '320px', borderTopColor: 'var(--accent-cyan)' }}>
           <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>WACS Master Audit</h3>
           <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Generates a massive 44-column Excel CSV sheet containing every household's detailed WACS data.</p>
           <button onClick={exportWacsToCSV} className="btn btn-secondary" style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Icons.Download /> Download CSV
           </button>
         </div>
       </div>
    </div>
  );

  const SchedulesView = () => (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ color: 'var(--accent-cyan)', margin: '0 0 8px 0' }}>Route Schedule Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Update collection days here. The Citizen App will sync instantly.</p>
        </div>
        <button onClick={saveAllSchedules} className="btn btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Save /> Deploy Updates
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Barangay Node</th>
            <th>Active Collection Schedule</th>
          </tr>
        </thead>
        <tbody>
          {barangayList.map(bgy => (
            <tr key={bgy}>
              <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{bgy}</td>
              <td>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', background: 'var(--bg-surface-glass)' }}
                  value={editedSchedules[bgy] || ''}
                  onChange={(e) => setEditedSchedules({...editedSchedules, [bgy]: e.target.value})}
                  placeholder="e.g. Monday, Wednesday, Friday"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const StrategicView = () => {
    if (!wacsSession.active) {
      return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ marginBottom: '30px' }}>
            <Icons.Profiling />
            <h2 style={{ color: 'var(--accent-cyan)', margin: '10px 0' }}>Initialize WACS Protocol</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Select a target barangay and establish the required sample size for the Solid Waste Characterization Study.</p>
          </div>

          {completedBarangays.length > 0 && (
            <div className="completed-bgy-banner">
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-neon)' }}>COMPLETED NODES:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                {completedBarangays.map(b => <span key={b} className="ai-badge ai-badge-special"><Icons.Check /> {b}</span>)}
              </div>
            </div>
          )}

          <form onSubmit={startWacsSession} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            <select name="bgy" required className="form-input" style={{ padding: '16px', fontSize: '16px' }}>
              <option value="">-- Select Target Barangay --</option>
              {barangayList.filter(b => !completedBarangays.includes(b)).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input name="target" type="number" required min="1" placeholder="Target Number of Households (e.g. 29)" className="form-input" style={{ padding: '16px', fontSize: '16px' }} />
            
            <button type="submit" className="btn btn-primary" style={{ padding: '16px' }}>Begin Data Entry ➔</button>
          </form>
        </div>
      );
    }

    const currentDetailedSum = calculateDetailedSum();
    const grand3DayTotal = (currentWacsDay === 1 ? currentDetailedSum : dailyTotals.day1) + 
                           (currentWacsDay === 2 ? currentDetailedSum : dailyTotals.day2) + 
                           (currentWacsDay === 3 ? currentDetailedSum : dailyTotals.day3);

    const currentBarangayCompletedRecords = wacsRecords.filter(r => r.barangay === wacsSession.barangay);

    return (
      <div className="wacs-active-container tab-transition">
        
        <div className="wacs-status-bar" style={{ position: 'relative' }}>
          <button 
            onClick={() => setWacsSession({...wacsSession, active: false})}
            className="btn btn-secondary" 
            style={{ position: 'absolute', top: '-15px', left: '20px', padding: '4px 12px', fontSize: '10px' }}
          >
            ← Back (Auto-Saved)
          </button>
          <div>
            <h2 style={{ margin: '10px 0 0 0', color: 'var(--accent-cyan)' }}>
              {wacsSession.barangay.toUpperCase()}
              <span className="ai-badge ai-badge-special" style={{ marginLeft: '12px', verticalAlign: 'middle', border: '1px solid var(--accent-cyan)' }}>
                 DAY {currentWacsDay} OF 3
              </span>
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '1px' }}>ACTIVE WACS NODE</span>
          </div>
          <div className="wacs-progress-box">
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Household</span>
            <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent-neon)', lineHeight: '1' }}>
              {wacsSession.current + 1} <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>/ {wacsSession.target}</span>
            </span>
          </div>
        </div>

        <form onSubmit={processWacsLoop}>
          <div className="wacs-section-card">
            <h3 className="wacs-section-title">Household Information</h3>
            <div className="wacs-grid" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr' }}>
              <div className="wacs-input-cell">
                <label>Income Level</label>
                <select className="form-input" value={wacsDetailedForm.income_level} onChange={e => setWacsDetailedForm({...wacsDetailedForm, income_level: e.target.value})} disabled={currentWacsDay > 1} style={currentWacsDay > 1 ? {background: 'var(--border-dim)', color: 'var(--text-secondary)'} : {}}>
                  <option value="Low">Low</option><option value="Middle">Middle</option><option value="High">High</option>
                </select>
              </div>
              <InputCell label="Family Name" stateKey="family_name" type="text" placeholder="e.g. Dela Cruz" textOnly={true} formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              <InputCell label="No. of Adults" stateKey="adults_count" type="number" placeholder="0" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              <InputCell label="No. of Children" stateKey="children_count" type="number" placeholder="0" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              <div className="wacs-input-cell">
                <label>Total Member</label>
                <input 
                  type="number" className="form-input" 
                  value={(parseInt(wacsDetailedForm.adults_count)||0) + (parseInt(wacsDetailedForm.children_count)||0)} disabled 
                  style={{ background: 'var(--border-dim)', cursor: 'not-allowed', color: 'var(--text-secondary)', fontWeight: 'bold' }} 
                />
              </div>
            </div>
          </div>

          <div className="wacs-section-card" style={{ borderTop: '4px solid var(--text-secondary)', marginBottom: '20px' }}>
            <h3 className="wacs-section-title" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-dim)' }}>
              3-Day Episodic Generation (Total Weight)
            </h3>
            <div className="wacs-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <div className="wacs-input-cell">
                <label>Day 1 Total (kg)</label>
                <input type="number" className="form-input" disabled style={{ background: 'var(--border-dim)', fontWeight: 'bold', color: currentWacsDay === 1 ? 'var(--accent-neon)' : 'var(--text-secondary)' }} value={currentWacsDay === 1 ? currentDetailedSum.toFixed(2) : dailyTotals.day1.toFixed(2)} />
              </div>
              <div className="wacs-input-cell">
                <label>Day 2 Total (kg)</label>
                <input type="number" className="form-input" disabled style={{ background: 'var(--border-dim)', fontWeight: 'bold', color: currentWacsDay === 2 ? 'var(--accent-neon)' : 'var(--text-secondary)' }} value={currentWacsDay === 2 ? currentDetailedSum.toFixed(2) : (dailyTotals.day2 > 0 ? dailyTotals.day2.toFixed(2) : '')} />
              </div>
              <div className="wacs-input-cell">
                <label>Day 3 Total (kg)</label>
                <input type="number" className="form-input" disabled style={{ background: 'var(--border-dim)', fontWeight: 'bold', color: currentWacsDay === 3 ? 'var(--accent-neon)' : 'var(--text-secondary)' }} value={currentWacsDay === 3 ? currentDetailedSum.toFixed(2) : (dailyTotals.day3 > 0 ? dailyTotals.day3.toFixed(2) : '')} />
              </div>
              <div className="wacs-input-cell">
                <label>3-Day Grand Total</label>
                <input type="number" className="form-input" disabled style={{ background: 'var(--border-dim)', color: 'var(--text-secondary)', fontWeight: '900' }} value={grand3DayTotal > 0 ? grand3DayTotal.toFixed(2) : ''} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="wacs-section-card bio-border">
              <h3 className="wacs-section-title" style={{ color: 'var(--accent-neon)' }}>Biodegradable Waste</h3>
              <div className="wacs-grid">
                <InputCell label="Food/Kitchen" stateKey="bio_food" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Garden/Park" stateKey="bio_garden" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Agri/Farm" stateKey="bio_agri" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Livestock" stateKey="bio_livestock" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
            </div>
            <div className="wacs-section-card rec-border">
              <h3 className="wacs-section-title" style={{ color: 'var(--accent-cyan)' }}>Recyclable Waste</h3>
              <div className="wacs-sub-header">Paper</div>
              <div className="wacs-grid">
                <InputCell label="White Ledger" stateKey="rec_pap_white" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Newspaper" stateKey="rec_pap_news" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Cartons" stateKey="rec_pap_carton" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Mixed Paper" stateKey="rec_pap_mixed" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Bev. Cartons" stateKey="rec_pap_bev" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
              <div className="wacs-sub-header">Plastics & Glass</div>
              <div className="wacs-grid">
                <InputCell label="PET" stateKey="rec_pla_pet" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="HDPE" stateKey="rec_pla_hdpe" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="PVC" stateKey="rec_pla_pvc" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="LDPE" stateKey="rec_pla_ldpe" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Glass Bottles" stateKey="rec_gls_bottles" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Flat Glass" stateKey="rec_gls_flat" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
              <div className="wacs-sub-header">Metals</div>
              <div className="wacs-grid">
                <InputCell label="Tin" stateKey="rec_met_tin" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Aluminum" stateKey="rec_met_alum" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Steel" stateKey="rec_met_steel" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Copper" stateKey="rec_met_copper" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
            </div>
            <div className="wacs-section-card res-border">
              <h3 className="wacs-section-title" style={{ color: 'var(--text-secondary)' }}>Residual Waste</h3>
              <div className="wacs-sub-header">Potential for Diversion</div>
              <div className="wacs-grid">
                <InputCell label="Grocery Bags" stateKey="res_div_grocery" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Pouches/Sachets" stateKey="res_div_pouches" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Drinking Straws" stateKey="res_div_straws" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Tarpaulins" stateKey="res_div_tarps" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Leather" stateKey="res_div_leather" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Rubber" stateKey="res_div_rubber" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Textile" stateKey="res_div_textile" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
              <div className="wacs-sub-header">For Disposal</div>
              <div className="wacs-grid">
                <InputCell label="Sanitary Composites" stateKey="res_disp_sanitary" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Soiled Paper" stateKey="res_disp_soiledpap" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Soiled Plastics" stateKey="res_disp_soiledpla" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Cigarette Butts" stateKey="res_disp_cigs" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
            </div>
            <div className="wacs-section-card spec-border">
              <h3 className="wacs-section-title" style={{ color: 'var(--danger)' }}>Special Waste</h3>
              <div className="wacs-sub-header">Hazardous</div>
              <div className="wacs-grid">
                <InputCell label="WEEE (Electronics)" stateKey="spec_weee" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="HH Healthcare" stateKey="spec_hh_health" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Lighting" stateKey="spec_lighting" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Chemicals" stateKey="spec_chemical" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Hosp. Healthcare" stateKey="spec_hosp_health" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
              <div className="wacs-sub-header">Bulky</div>
              <div className="wacs-grid">
                <InputCell label="Yard Waste" stateKey="spec_bulky_yard" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Construction" stateKey="spec_bulky_const" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
                <InputCell label="Rubber Tires" stateKey="spec_bulky_tires" formData={wacsDetailedForm} setFormData={setWacsDetailedForm} />
              </div>
            </div>
          </div>

          <div className="wacs-action-bar" style={{ justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={handleResetForm} className="btn btn-danger" style={{ marginRight: 'auto' }}>
              Clear Day {currentWacsDay} Input
            </button>
            <button type="button" onClick={handleSaveDraft} className="btn btn-secondary">
              Save Draft
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icons.Save /> {currentWacsDay === 3 ? `Submit Full Household ${wacsSession.current + 1}` : `Save Day ${currentWacsDay} & Next ➔`}
            </button>
          </div>
        </form>

        {currentBarangayCompletedRecords.length > 0 && (
          <div className="card" style={{ marginTop: '32px', borderTop: '4px solid var(--accent-cyan)' }}>
            <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Queue: Completed Households ({wacsSession.barangay})</span>
              <span className="ai-badge" style={{ background: 'var(--accent-cyan)', color: '#000' }}>{currentBarangayCompletedRecords.length} LOGGED</span>
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Family Name</th>
                    <th>Grand Total (3-Day)</th>
                    <th>Date Logged</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBarangayCompletedRecords.map(record => (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 'bold' }}>{record.wacs_households?.family_name || 'Unknown'}</td>
                      <td>{record.grand_total} kg</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(record.submitted_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                          onClick={() => toast.show({ variant: 'info', title: 'Edit Mode', message: 'Full edit capability coming soon.' })}
                        >
                          <Icons.Edit /> Edit Data
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper theme-light">
      <ConfirmModal />
      {isOffline && <div className="offline-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Icons.AlertTriangle />OFFLINE MODE: Data saving locally</div>}
      
      <button className={`global-hamburger ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(!isSidebarOpen)}> <Icons.Menu /> </button>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ top: isOffline ? '40px' : '0' }}>
        <div className="sidebar-header" />
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}><span className="nav-icon"><Icons.Matrix /></span> <span className="nav-text">Operations Matrix</span></div>
          <div className={`nav-item ${activeTab === 'telemetry' ? 'active' : ''}`} onClick={() => setActiveTab('telemetry')}><span className="nav-icon"><Icons.Map /></span> <span className="nav-text">Live Map Tracker</span></div>
          <div className={`nav-item ${activeTab === 'randomforest' ? 'active' : ''}`} onClick={() => setActiveTab('randomforest')}><span className="nav-icon"><Icons.Forecasting /></span> <span className="nav-text">Forest Forecasts</span></div>
          <div className={`nav-item ${activeTab === 'wacs' ? 'active' : ''}`} onClick={() => setActiveTab('wacs')}><span className="nav-icon"><Icons.Profiling /></span> <span className="nav-text">Strategic Profiling</span></div>
          <div className={`nav-item ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}><span className="nav-icon"><Icons.Calendar /></span> <span className="nav-text">Route Schedules</span></div>
          <div className={`nav-item ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}><span className="nav-icon"><Icons.Export /></span> <span className="nav-text">Data Export</span></div>
          <div className={`nav-item ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}><span className="nav-icon"><Icons.IdCard /></span> <span className="nav-text">Driver Management</span></div>
        </nav>

        <div className="sidebar-bottom">
          {isSettingsOpen && (
            <div className="settings-menu">
              <div className="settings-header">Preferences</div>
              <div className="settings-item logout-item" onClick={() => supabase.auth.signOut()}><Icons.LogOut /><span>Log Out</span></div>
            </div>
          )}
          <div className={`nav-item ${isSettingsOpen ? 'active' : ''}`} onClick={() => setIsSettingsOpen(!isSettingsOpen)} style={{ marginBottom: 0, marginTop: '16px' }} >
            <span className="nav-icon"><Icons.Settings /></span><span className="nav-text">Settings and Help</span>
          </div>
        </div>
      </aside>

      <main className={`main-content ${isSidebarOpen ? 'shifted' : ''}`} style={{ marginTop: isOffline ? '40px' : '0' }}>
       <header
         className="header-area"
         style={{
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'flex-start',
           gap: '16px',
           paddingLeft: isSidebarOpen ? '0' : '64px',
         }}
       >
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, color: 'var(--text-primary)' }}>
              {activeTab === 'matrix' ? 'Tactical Overview' : activeTab === 'telemetry' ? 'Live Map Tracker' : activeTab === 'wacs' ? 'Strategic Profiling' : activeTab === 'drivers' ? 'Driver Management' : activeTab === 'randomforest' ? 'Forest Forecasts' : activeTab === 'schedules' ? 'Route Schedules' : activeTab === 'export' ? 'Data Export' : activeTab.toUpperCase()}
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--accent-cyan)', fontSize: '13px' }}>● SYSTEM ONLINE | <b>Weekly Forecast Date: {new Date().toLocaleDateString()}</b></p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 900, letterSpacing: '0.6px' }}>
                MENRO<span style={{ color: 'var(--accent-neon)' }}>.DSS</span> LIANGA
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700 }}>
                COMMAND CENTER
              </div>
            </div>
            <img src="/logo-192.png" alt="LGU Lianga Seal" style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0 }} />
          </div>
        </header>

        <div key={activeTab} className="tab-transition">
          {activeTab === 'matrix' && MatrixView()}
          {activeTab === 'telemetry' && TelemetryView()}
          {activeTab === 'randomforest' && RandomForestView()}
          {activeTab === 'wacs' && StrategicView()}
          {activeTab === 'schedules' && SchedulesView()}
          {activeTab === 'export' && ExportView()}
          {activeTab === 'drivers' && DriverManagementView()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;