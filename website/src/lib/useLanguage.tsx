'use client';

import { useEffect, useState } from 'react';

const LANGUAGE_KEY = 'azurajs-language';
const DEFAULT_LANGUAGE = 'en';

export function useLanguage() {
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Recuperar idioma do localStorage
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored) {
      setLanguage(stored);
    }
  }, []);

  const saveLanguage = (lang: string) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
  };

  return { language, saveLanguage, isClient };
}

export function getStoredLanguage(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }
  return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
}
