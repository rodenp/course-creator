import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import enTranslations from './translations/en.json';
import nlTranslations from './translations/nl.json';
import daTranslations from './translations/da.json';

export type Language = 'en' | 'nl' | 'da';
export type TranslationKey = string;

interface Translations {
  [key: string]: unknown;
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  nl: nlTranslations,
  da: daTranslations,
};

// Detect browser language
export const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('nl')) return 'nl';
  if (browserLang.startsWith('da')) return 'da';
  if (browserLang.startsWith('en')) return 'en';

  // Default to English if no match
  return 'en';
};

// Get nested translation value
export const getTranslation = (
  translations: Translations,
  key: string,
  fallback?: string
): string => {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k] as Translations;
    } else {
      return fallback || key;
    }
  }

  return typeof value === 'string' ? value : fallback || key;
};

// Language context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  languages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Language provider
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get saved language from localStorage, otherwise detect browser language
    const saved = localStorage.getItem('preferred-language') as Language;
    return saved && saved in translations ? saved : detectBrowserLanguage();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(translations[language], key, fallback);
  };

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'nl' as Language, name: 'Nederlands', flag: '🇳🇱' },
    { code: 'da' as Language, name: 'Dansk', flag: '🇩🇰' },
  ];

  const contextValue = { language, setLanguage, t, languages };

  return React.createElement(
    LanguageContext.Provider,
    { value: contextValue },
    children
  );
};

// Hook for easy translation
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};

// Export types and utilities
export { translations };
export default translations;
