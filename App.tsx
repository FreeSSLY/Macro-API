
import React, { useState, useMemo, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserProfile as UserProfileType, DailyLog, MacroGoals, BodyCompositionLog } from './types';
import * as dataService from './services/dataService';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import MacroTracker from './components/MacroTracker';
import ProgressChart from './components/ProgressChart';
import LeanMassCalculator from './components/LeanMassCalculator';
import UpdateMeasurements from './components/CurrentWeight';
import WorkoutPlanner from './components/WorkoutPlanner';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import PrintableReport from './components/PrintableReport';
import { LogoIcon, ChartIcon, CalculatorIcon, TrackerIcon, WeightIcon, LogoutIcon, DumbbellIcon, UserIcon } from './components/Icons';
import { calculateTDEE } from './utils/calculations';
import { supabase } from './supabaseClient';

type View = 'tracker' | 'progress' | 'calculator' | 'weight' | 'workout';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [customGoals, setCustomGoals] = useState<MacroGoals | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [bodyCompositionHistory, setBodyCompositionHistory] = useState<BodyCompositionLog[]>([]);
  const [view, setView] = useState<View>('tracker');
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setLogs({});
        setBodyCompositionHistory([]);
        setCurrentWeight(0);
        setCustomGoals(null);
        setIsPrintView(false);
      }
      setLoading(false);
    });
    
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadUserData(session.user.id);
    }
  }, [session]);

  const handleLogout = async () => {
      setLoading(true);
      await supabase.auth.signOut();
      // State will be cleared by onAuthStateChange listener
      setLoading(false);
  }

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
        let userProfile = await dataService.getProfile(userId);

        // One-time migration from localStorage
        if (!userProfile) {
            const migrated = await dataService.migrateFromLocalStorage(userId);
            if (migrated) {
                userProfile = await dataService.getProfile(userId);
            }
        }

        if (userProfile) {
          setProfile(userProfile);
          setCurrentWeight(userProfile.currentWeight || userProfile.weight);
          setCustomGoals(userProfile.customGoals);
          
          const [userLogs, userHistory] = await Promise.all([
            dataService.getLogs(userId),
            dataService.getHistory(userId),
          ]);
          setLogs(userLogs);
          setBodyCompositionHistory(userHistory);
        }
    } catch (error) {
        console.error("Fatal error loading user data:", error);
        alert("Não foi possível carregar seus dados. Verifique sua conexão com a internet ou as configurações do seu projeto Supabase. Você será desconectado.");
        await handleLogout();
    } finally {
        setLoading(false);
    }
  };
  
  const handleProfileSave = async (newProfileData: Omit<UserProfileType, 'id'>) => {
    if (!session) return;
    setLoading(true);
    const newProfile = await dataService.createProfile(session.user.id, newProfileData);
    if (newProfile) {
        setProfile(newProfile);
        setCurrentWeight(newProfile.currentWeight || newProfile.weight);
    }
    setLoading(false);
  };

  const handleProfileUpdate = async (updates: Partial<UserProfileType>) => {
    if (!session || !profile) return;
    
    const originalProfile = { ...profile };
    const originalCustomGoals = customGoals;

    // Optimistic UI update
    const updatedProfile = { ...profile!, ...updates };
    setProfile(updatedProfile);

    if (updates.currentWeight) {
        setCurrentWeight(updates.currentWeight);
    }
    if (updates.customGoals !== undefined) { // Allow setting to null
        setCustomGoals(updates.customGoals);
    }
    
    const result = await dataService.updateProfile(session.user.id, updates);
    
    if (result) {
      setProfile(result);
      if (result.currentWeight) setCurrentWeight(result.currentWeight);
      setCustomGoals(result.customGoals); 
    } else {
      // Rollback on failure
      setProfile(originalProfile as UserProfileType);
      setCustomGoals(originalCustomGoals);
      if (updates.currentWeight) setCurrentWeight(originalProfile.currentWeight || originalProfile.weight!);
      alert("Falha ao atualizar. Por favor, tente novamente.");
    }
};

  const handleSetLogs = async (newLogs: Record<string, DailyLog>) => {
      if (!session) return;
      setLogs(newLogs);
      // This is a simplified approach; in a real app, we'd only upsert the changed log
      for (const date in newLogs) {
          await dataService.upsertLog(session.user.id, date, newLogs[date]);
      }
  };
  
  const handleSetCustomGoals = async (goals: MacroGoals | null) => {
    if(!session) return;
    await handleProfileUpdate({ customGoals: goals });
  };
  
  const handleSetHistory = async (history: BodyCompositionLog[]) => {
    if (!session) return;
    const latestEntry = history[history.length - 1];
    const existingEntryIndex = bodyCompositionHistory.findIndex(h => h.date === latestEntry.date);

    if (existingEntryIndex === -1 || JSON.stringify(bodyCompositionHistory[existingEntryIndex]) !== JSON.stringify(latestEntry)) {
       await dataService.upsertHistory(session.user.id, latestEntry);
    }
    setBodyCompositionHistory(history);
  };
  

  const macroGoals = useMemo(() => {
    if (customGoals) return customGoals;
    if (!profile) return { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    
    const profileForTDEE = { ...profile, weight: currentWeight > 0 ? currentWeight : profile.weight };

    const tdee = calculateTDEE(profileForTDEE);
    return {
      calories: Math.round(tdee),
      protein: Math.round((tdee * 0.30) / 4),
      carbs: Math.round((tdee * 0.40) / 4),
      fat: Math.round((tdee * 0.30) / 9)
    };
  }, [profile, customGoals, currentWeight]);


  if (loading) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!session) {
    return <Auth />;
  }
  
  if (!profile) {
    return <UserProfile onSave={handleProfileSave} />;
  }

  if (isPrintView) {
      return (
          <PrintableReport 
            profile={profile} 
            logs={logs} 
            history={bodyCompositionHistory} 
            macroGoals={macroGoals}
            onClose={() => setIsPrintView(false)} 
          />
      );
  }

  const renderView = () => {
    switch (view) {
      case 'tracker':
        return <MacroTracker logs={logs} setLogs={handleSetLogs} macroGoals={macroGoals} setCustomGoals={handleSetCustomGoals} />;
      case 'progress':
        return <ProgressChart logs={logs} />;
      case 'calculator':
        return <LeanMassCalculator profile={profile} currentWeight={currentWeight} history={bodyCompositionHistory} setHistory={handleSetHistory} />;
      case 'weight':
        return <UpdateMeasurements profile={profile} macroGoals={macroGoals} onProfileUpdate={handleProfileUpdate} />;
      // case 'workout':
      //   return <WorkoutPlanner />;
      default:
        return <MacroTracker logs={logs} setLogs={handleSetLogs} macroGoals={macroGoals} setCustomGoals={handleSetCustomGoals} />;
    }
  };

  const NavItem: React.FC<{
    currentView: View;
    viewName: View;
    icon: React.ReactNode;
    label: string;
  }> = ({ currentView, viewName, icon, label }) => (
    <button
      onClick={() => setView(viewName)}
      className={`flex flex-col items-center justify-center space-y-1 w-full p-2 rounded-lg transition-colors duration-200 ${
        currentView === viewName ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="text-[10px] md:text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
       {isProfileModalOpen && (
          <ProfileSettingsModal 
            initialProfile={profile} 
            onUpdateProfile={handleProfileUpdate} 
            onClose={() => setIsProfileModalOpen(false)} 
            onOpenReport={() => { setIsProfileModalOpen(false); setIsPrintView(true); }}
          />
       )}
       <header className="p-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <LogoIcon className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold text-white">Macro Tracker AI</h1>
        </div>
        <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-300">{profile.name}</p>
                <p className="text-xs text-gray-400">{currentWeight} kg · {profile.height} cm</p>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => setIsProfileModalOpen(true)} title="Meu Perfil" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
                    <UserIcon className="w-6 h-6"/>
                </button>
                <button onClick={handleLogout} title="Sair" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
                    <LogoutIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mb-20 md:ml-20">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 grid grid-cols-5 gap-1 z-20 md:hidden">
        <NavItem currentView={view} viewName="tracker" icon={<TrackerIcon className="w-6 h-6" />} label="Diário" />
        <NavItem currentView={view} viewName="progress" icon={<ChartIcon className="w-6 h-6" />} label="Progresso" />
        <NavItem currentView={view} viewName="workout" icon={<DumbbellIcon className="w-6 h-6" />} label="Treino" />
        <NavItem currentView={view} viewName="weight" icon={<WeightIcon className="w-6 h-6" />} label="Peso" />
        <NavItem currentView={view} viewName="calculator" icon={<CalculatorIcon className="w-6 h-6" />} label="Cálculos" />
      </nav>
      
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full bg-gray-800 w-20 flex-col items-center py-6 space-y-6">
        <LogoIcon className="w-10 h-10 text-blue-500 mb-4"/>
        <NavItem currentView={view} viewName="tracker" icon={<TrackerIcon className="w-7 h-7" />} label="Diário" />
        <NavItem currentView={view} viewName="progress" icon={<ChartIcon className="w-7 h-7" />} label="Progresso" />
        <NavItem currentView={view} viewName="workout" icon={<DumbbellIcon className="w-7 h-7" />} label="Treino" />
        <NavItem currentView={view} viewName="weight" icon={<WeightIcon className="w-7 h-7" />} label="Peso" />
        <NavItem currentView={view} viewName="calculator" icon={<CalculatorIcon className="w-7 h-7" />} label="Cálculos" />
      </nav>

    </div>
  );
};

export default App;
