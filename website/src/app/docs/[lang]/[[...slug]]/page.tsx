import { getPageImage, getSource } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';

export default async function Page(props: { params: Promise<{ lang: string; slug?: string[] }> }) {
  const params = await props.params;
  const source = getSource(params.lang);
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const params: Array<{ lang: string; slug?: string[] }> = [];
  
  for (const [lang, source] of Object.entries({ en: getSource('en'), pt: getSource('pt') })) {
    const pages = source.getPages();
    params.push(
      ...pages.map((page) => ({
        lang,
        slug: page.slugs,
      }))
    );
  }
  
  return params;
}

export async function generateMetadata(props: { params: Promise<{ lang: string; slug?: string[] }> }): Promise<Metadata> {
  const params = await props.params;
  const source = getSource(params.lang);
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
