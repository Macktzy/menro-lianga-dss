import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import Dashboard from './Dashboard';
import DriverPortal from './DriverPortal';
import CitizenPortal from './CitizenPortal';
import { useToast } from './ui/toast/ToastProvider.jsx';

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // 1. Handle Authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setRole(null);
        localStorage.removeItem('menro_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Handle Role Check
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      // Step 1: Check drivers table FIRST
      const { data: driver } = await supabase
        .from('drivers')
        .select('full_name, assigned_fleet, status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (driver) {
        localStorage.setItem('menro_user', JSON.stringify({
          full_name: driver.full_name || session.user.email,
          role: 'driver',
          assigned_fleet: driver.assigned_fleet || 'Unassigned',
        }));

        setRole('driver');
        setLoading(false);
        return;
      }

      // Step 2: Check profiles table for Admin / Citizen
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.role) {
        localStorage.setItem('menro_user', JSON.stringify({
          full_name: profile.full_name || session.user.email,
          role: profile.role,
        }));

        setRole(profile.role);
        setLoading(false);
        return;
      }

      // Step 3: Check citizen_profiles table
      const { data: citizen } = await supabase
        .from('citizen_profiles')
        .select('full_name, barangay')
        .eq('id', session.user.id)
        .maybeSingle();

      if (citizen) {
        localStorage.setItem('menro_user', JSON.stringify({
          full_name: citizen.full_name || session.user.email,
          role: 'citizen',
          barangay: citizen.barangay || '',
        }));

        setRole('citizen');
        setLoading(false);
        return;
      }

      // Step 4: Authenticated but not in any table
      await supabase.auth.signOut();
      toast.show({
        variant: 'error',
        title: 'Access Denied',
        message: 'Account not found in MENRO records.',
      });

      setRole(null);
      setLoading(false);
    })();
  }, [session, toast]);

  // 3. Loading Screen
  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
          Loading MENRO system…
        </div>
        <div style={{ color: '#64748b', fontWeight: 600, fontSize: 13 }}>
          Syncing your session and permissions.
        </div>
      </div>
    );
  }

  if (!session) return <Login />;

  if (role === 'admin') return <Dashboard session={session} />;

  if (role === 'driver') return <DriverPortal session={session} />;

  if (role === 'citizen') return <CitizenPortal session={session} />;

  return <Login />;
}

export default App;