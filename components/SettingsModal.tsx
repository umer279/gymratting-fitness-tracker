
import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { AVATARS } from '../constants';
import { Save, LogOut, ShieldAlert, X, DownloadCloud, Share } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { state, updateProfile, deleteAccount, triggerInstallPrompt } = useFitness();
    const [name, setName] = useState(state.profile?.name || '');
    const [avatar, setAvatar] = useState(state.profile?.avatar || AVATARS[0]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.profile || !name.trim() || isLoading) return;
        setIsLoading(true);
        await updateProfile(state.profile.id, name, avatar);
        setIsLoading(false);
        onClose();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onClose();
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('DANGER: Are you sure you want to permanently delete your account and all data? This cannot be undone.')) {
            await deleteAccount();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X /></button>
                <h2 className="text-2xl font-bold mb-6 text-white">Settings</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="profileName" className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                        <input
                            id="profileName"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-700 border-slate-600 rounded-md p-2 text-white placeholder-slate-400"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Avatar</label>
                        <div className="grid grid-cols-4 gap-4">
                            {AVATARS.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => setAvatar(av)}
                                    className={`text-4xl p-2 rounded-full flex items-center justify-center transition-all ${avatar === av ? 'bg-electric-blue-600 scale-110' : 'bg-slate-700 hover:bg-slate-600'}`}
                                    disabled={isLoading}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 flex items-center disabled:opacity-50" disabled={isLoading}>
                            <Save className="w-4 h-4 mr-2"/> {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <div className="border-t border-slate-700 my-6"></div>

                <div className="space-y-3">
                    {state.deferredPrompt && (
                        <button
                            onClick={triggerInstallPrompt}
                            className="w-full flex items-center justify-center text-sm py-2 px-3 bg-electric-blue-600 text-white font-bold hover:bg-electric-blue-500 rounded-lg transition-colors"
                        >
                            <DownloadCloud className="w-4 h-4 mr-2" />
                            Download App
                        </button>
                    )}
                    {state.showIosInstallInstructions && (
                         <div className="text-center p-3 bg-slate-700 rounded-lg border border-slate-600">
                            <p className="text-sm font-semibold text-slate-200 mb-2">Install Gymratting</p>
                            <p className="text-xs text-slate-300 leading-relaxed">
                            Tap the <Share className="inline-block w-4 h-4 mx-1" /> icon in your browser's toolbar, then tap "Add to Home Screen".
                            </p>
                        </div>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center justify-center text-sm py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                    <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center text-sm py-2 px-3 bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-red-300 rounded-lg transition-colors">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
