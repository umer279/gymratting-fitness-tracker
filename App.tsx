
import React, { useState } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import PlansScreen from './components/PlansScreen';
import HistoryScreen from './components/HistoryScreen';
import ExercisesScreen from './components/ExercisesScreen';
import WorkoutSession from './components/WorkoutSession';
import { Dumbbell, History, List, Home, Loader } from 'lucide-react';
import { WorkoutPlan } from './types';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';

type Screen = 'DASHBOARD' | 'PLANS' | 'HISTORY' | 'EXERCISES';

const App: React.FC = () => {
  return (
    <FitnessProvider>
      <AppContent />
    </FitnessProvider>
  );
};

const AppContent: React.FC = () => {
  const { state } = useFitness();

  if (state.isLoading) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Loader className="w-10 h-10 animate-spin text-electric-blue-500" />
        </div>
    )
  }

  if (!state.session || !state.profile) {
    return <AuthScreen />;
  }
  
  return <MainApp />;
}

const MainApp: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('DASHBOARD');
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<WorkoutPlan | null>(null);

  const handleStartWorkout = (plan: WorkoutPlan) => {
    setActiveWorkoutPlan(plan);
  };

  const handleFinishWorkout = () => {
    setActiveWorkoutPlan(null);
    setActiveScreen('HISTORY');
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
      default:
        return <Dashboard setActiveScreen={setActiveScreen} onStartWorkout={handleStartWorkout} />;
    }
  };

  const navItems = [
    { name: 'DASHBOARD', icon: Home, label: 'Home' },
    { name: 'PLANS', icon: List, label: 'Plans' },
    { name: 'HISTORY', icon: History, label: 'History' },
    { name: 'EXERCISES', icon: Dumbbell, label: 'Exercises' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col md:flex-row">
      {!activeWorkoutPlan && (
        <>
          <nav className="hidden md:flex md:flex-col md:w-64 bg-slate-950 p-4 border-r border-slate-800">
            <div className="flex items-center justify-center mb-8">
              <img src="/logo.png" alt="Gymratting Logo" className="w-32 h-32" />
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
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
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
    </div>
  );
};

export default App;
