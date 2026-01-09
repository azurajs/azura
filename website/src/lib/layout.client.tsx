'use client';

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from './layout.shared';
import { useLanguage } from './useLanguage';

export function useBaseOptions(): BaseLayoutProps {
  const { language, isClient } = useLanguage();
  return baseOptions(isClient ? language : 'en');
}
