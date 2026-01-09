import { sources } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Detect language from referer URL
  const referer = request.headers.get('referer') || '';
  const lang = referer.includes('/docs/pt') ? 'pt' : 'en';
  
  const source = sources[lang as keyof typeof sources] || sources.en;
  const handler = createFromSource(source);
  
  return handler.GET(request);
}
