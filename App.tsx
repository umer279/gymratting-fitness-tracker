






import React, { useState } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import PlansScreen from './components/PlansScreen';
import HistoryScreen from './components/HistoryScreen';
import ExercisesScreen from './components/ExercisesScreen';
import WorkoutSession from './components/WorkoutSession';
import { Dumbbell, History, List, Home, Loader, Sparkles, TrendingUp } from 'lucide-react';
import { WorkoutPlan } from './types';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';
import AiAssistantModal from './components/AiAssistantModal';
import AnalyticsScreen from './components/AnalyticsScreen';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

type Screen = 'DASHBOARD' | 'PLANS' | 'HISTORY' | 'EXERCISES' | 'ANALYTICS';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <FitnessProvider>
        <AppContent />
      </FitnessProvider>
    </LanguageProvider>
  );
};

const AppContent: React.FC = () => {
  const { state } = useFitness();
  const { t } = useLanguage();

  if (state.isLoading) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center" role="status" aria-label={t('loading')}>
            <Loader className="w-10 h-10 animate-spin text-electric-blue-500" aria-hidden="true" />
            <p className="sr-only">{t('loading')}</p>
        </div>
    )
  }

  if (!state.session || !state.profile) {
    return <AuthScreen />;
  }
  
  return <MainApp />;
}

const MainApp: React.FC = () => {
  const { state } = useFitness();
  const { t } = useLanguage();
  const [activeScreen, setActiveScreen] = useState<Screen>('DASHBOARD');
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const isAiEnabled = (import.meta as any).env.VITE_GEMINI_API_KEY;

  const handleStartWorkout = (plan: WorkoutPlan) => {
    setActiveWorkoutPlan(plan);
  };

  const handleFinishWorkout = () => {
    setActiveWorkoutPlan(null);
    setActiveScreen('HISTORY');
  };
  
  const handleOpenAiAssistant = (prompt?: string) => {
    setAiInitialPrompt(prompt);
    setShowAiAssistant(true);
  }
  
  const handleCloseAiAssistant = () => {
    setShowAiAssistant(false);
    setAiInitialPrompt(undefined);
  }

  const handleAiButtonClick = () => {
    if (state.profile?.is_pro) {
      handleOpenAiAssistant();
    } else {
      alert(`${t('premium_feature_title')}\n\n${t('premium_feature_description')}`);
    }
  };

  const renderScreen = () => {
    if (activeWorkoutPlan) {
      return <WorkoutSession plan={activeWorkoutPlan} onFinish={handleFinishWorkout} />;
    }
    switch (activeScreen) {
      case 'DASHBOARD':
        return <Dashboard setActiveScreen={setActiveScreen} onStartWorkout={handleStartWorkout} />;
      case 'PLANS':
        return <PlansScreen onStartWorkout={handleStartWorkout} />;
      case 'HISTORY':
        return <HistoryScreen />;
      case 'EXERCISES':
        return <ExercisesScreen />;
      case 'ANALYTICS':
        return <AnalyticsScreen onOpenAiAssistant={handleOpenAiAssistant} />;
      default:
        return <Dashboard setActiveScreen={setActiveScreen} onStartWorkout={handleStartWorkout} />;
    }
  };

  const navItems = [
    { name: 'DASHBOARD', icon: Home, label: t('nav_home') },
    { name: 'PLANS', icon: List, label: t('nav_plans') },
    { name: 'HISTORY', icon: History, label: t('nav_history') },
    { name: 'ANALYTICS', icon: TrendingUp, label: t('nav_analytics') },
    { name: 'EXERCISES', icon: Dumbbell, label: t('nav_exercises') },
  ];

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col md:flex-row">
      {!activeWorkoutPlan && (
        <>
          <nav className="hidden md:flex md:flex-col md:w-64 bg-slate-950 p-4 border-r border-slate-800">
            <div className="flex items-center justify-center mb-8">
              <img src="/logo.png" alt="Gymratting Logo" className="w-16 h-16" />
            </div>
            <ul>
              {navItems.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => setActiveScreen(item.name as Screen)}
                    className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors ${
                      activeScreen === item.name
                        ? 'bg-electric-blue-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 flex justify-around p-2 z-50">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveScreen(item.name as Screen)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors w-1/5 ${
                  activeScreen === item.name
                    ? 'text-electric-blue-500'
                    : 'text-slate-400 hover:text-electric-blue-500'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      <main className={`flex-1 transition-all duration-300 ${!activeWorkoutPlan ? 'pb-20 md:pb-0' : ''}`}>
        {renderScreen()}
      </main>

      {showAiAssistant && <AiAssistantModal onClose={handleCloseAiAssistant} initialPrompt={aiInitialPrompt} />}
      
      {!activeWorkoutPlan && isAiEnabled && (
        <button 
          onClick={handleAiButtonClick}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 w-16 h-16 bg-electric-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-electric-blue-500 transition-transform transform hover:scale-110"
          aria-label="Open AI Fitness Coach"
        >
          <Sparkles className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};

export default App;