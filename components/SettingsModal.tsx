

import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { AVATARS } from '../constants';
import { Save, LogOut, ShieldAlert, X, DownloadCloud, Share, Menu } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { state, updateProfile, deleteAccount, triggerInstallPrompt } = useFitness();
    const { language, setLanguage, t } = useLanguage();
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
        if (window.confirm(t('settings_delete_account_confirm'))) {
            await deleteAccount();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X /></button>
                <h2 className="text-2xl font-bold mb-6 text-white">{t('settings_title')}</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="profileName" className="block text-sm font-medium text-slate-300 mb-1">{t('settings_name_label')}</label>
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings_avatar_label')}</label>
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
                            <Save className="w-4 h-4 mr-2"/> {isLoading ? t('settings_saving_button') : t('settings_save_button')}
                        </button>
                    </div>
                </form>

                <div className="border-t border-slate-700 my-6"></div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                    <div className="flex rounded-lg bg-slate-900 p-1 w-full">
                        <button onClick={() => setLanguage('en')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${language === 'en' ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                            English
                        </button>
                         <button onClick={() => setLanguage('it')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${language === 'it' ? 'bg-electric-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                            Italiano
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {state.deferredPrompt && (
                        <button
                            onClick={triggerInstallPrompt}
                            className="w-full flex items-center justify-center text-sm py-2 px-3 bg-electric-blue-600 text-white font-bold hover:bg-electric-blue-500 rounded-lg transition-colors"
                        >
                            <DownloadCloud className="w-4 h-4 mr-2" />
                            {t('settings_download_app_button')}
                        </button>
                    )}
                    {state.showAndroidInstallInstructions && (
                         <div className="text-center p-3 bg-slate-700 rounded-lg border border-slate-600">
                            <p className="text-sm font-semibold text-slate-200 mb-2">{t('settings_install_android_title')}</p>
                            <p className="text-xs text-slate-300 leading-relaxed">
                            {t('settings_install_android_instructions', { icon: '' }).split('{{icon}}')[0]}
                            <Menu className="inline-block w-4 h-4 mx-1" />
                            {t('settings_install_android_instructions', { icon: '' }).split('{{icon}}')[1]}
                            </p>
                        </div>
                    )}
                    {state.showIosInstallInstructions && (
                         <div className="text-center p-3 bg-slate-700 rounded-lg border border-slate-600">
                            <p className="text-sm font-semibold text-slate-200 mb-2">{t('settings_install_ios_title')}</p>
                            <p className="text-xs text-slate-300 leading-relaxed">
                            {t('settings_install_ios_instructions', { icon: '' }).split('{{icon}}')[0]}
                            <Share className="inline-block w-4 h-4 mx-1" />
                            {t('settings_install_ios_instructions', { icon: '' }).split('{{icon}}')[1]}
                            </p>
                        </div>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center justify-center text-sm py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('settings_logout_button')}
                    </button>
                    <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center text-sm py-2 px-3 bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-red-300 rounded-lg transition-colors">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        {t('settings_delete_account_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;