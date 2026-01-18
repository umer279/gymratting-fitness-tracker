
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

const AuthScreen: React.FC = () => {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // On successful login, the onAuthStateChange listener in FitnessContext will handle profile creation.
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage(t('auth_signup_success'));
            }
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center justify-center mb-8">
                    <img src="/logo.png" alt="Gymratting Logo" className="w-32 h-32 mb-4" />
                </div>

                <div className="bg-slate-800 rounded-lg shadow-xl p-8">
                    <div className="flex border-b border-slate-700 mb-6">
                        <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 font-semibold transition-colors ${isLogin ? 'text-electric-blue-400 border-b-2 border-electric-blue-400' : 'text-slate-400 hover:text-white'}`}>
                            {t('auth_login_tab')}
                        </button>
                        <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 font-semibold transition-colors ${!isLogin ? 'text-electric-blue-400 border-b-2 border-electric-blue-400' : 'text-slate-400 hover:text-white'}`}>
                            {t('auth_signup_tab')}
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">{t('auth_email_label')}</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-slate-300">{t('auth_password_label')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md p-3 text-white placeholder-slate-400 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                            />
                        </div>

                        {error && <p className="text-sm text-red-400">{error}</p>}
                        {message && <p className="text-sm text-green-400">{message}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 bg-electric-blue-600 text-white font-bold rounded-lg hover:bg-electric-blue-500 transition-colors disabled:opacity-50"
                            >
                                {loading ? t('auth_processing') : (isLogin ? t('auth_login_tab') : t('auth_signup_tab'))}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;