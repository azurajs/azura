'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

export function GetStartedButton() {
  const { language, isClient } = useLanguage();
  const href = isClient ? `/docs/${language}` : '/docs/en';

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
    >
      <BookOpen size={18} />
      Get Started
      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
