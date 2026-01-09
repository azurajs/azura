'use client';

import { useEffect } from 'react';

export function LanguageSaver({ lang }: { lang: string }) {
  useEffect(() => {
    // Salvar idioma no localStorage quando o usuário visita uma página de docs
    if (typeof window !== 'undefined') {
      localStorage.setItem('azurajs-language', lang);
    }
  }, [lang]);

  return null;
}
