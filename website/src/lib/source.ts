import { enDocs, ptDocs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { i18n } from "./i18n";

// Create a map of sources by language
export const sources = {
  en: loader({
    baseUrl: "/docs/en",
    source: enDocs.toFumadocsSource(),
    plugins: [lucideIconsPlugin()],
  }),
  pt: loader({
    baseUrl: "/docs/pt",
    source: ptDocs.toFumadocsSource(),
    plugins: [lucideIconsPlugin()],
  }),
} as const;

// Helper to get source by language
export function getSource(lang: string) {
  return sources[lang as keyof typeof sources] || sources.en;
}

// Default source for backwards compatibility
export const source = sources.en;

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
}
