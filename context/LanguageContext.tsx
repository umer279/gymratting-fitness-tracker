
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '../locales/en.json';
import it from '../locales/it.json';
import { ExerciseCategory } from '../types';

type Translations = typeof en;
const translations: { [key: string]: Translations } = { en, it };

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: keyof Translations, options?: { [key: string]: string | number }) => string;
  tCategory: (category: ExerciseCategory) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const savedLang = localStorage.getItem('gymratting_lang');
    if (savedLang && translations[savedLang]) {
      return savedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'en';
  });

  const setLanguage = (lang: string) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('gymratting_lang', lang);
    }
  };

  const t = useCallback((key: keyof Translations, options?: { [key: string]: string | number }): string => {
    let translation = translations[language][key] || translations['en'][key];
    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{{${optionKey}}}`, String(options[optionKey]));
      });
    }
    return translation;
  }, [language]);
  
  const tCategory = useCallback((category: ExerciseCategory): string => {
    return t(category as any) || category;
  }, [t]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tCategory }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
