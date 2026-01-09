import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

// Custom schema with language support
const customFrontmatterSchema = frontmatterSchema.extend({
  lang: z.enum(['en', 'pt']).optional(),
  icon: z.string().optional(),
});

// English docs
export const enDocs = defineDocs({
  dir: 'content/docs/en',
  docs: {
    schema: customFrontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// Portuguese docs
export const ptDocs = defineDocs({
  dir: 'content/docs/pt',
  docs: {
    schema: customFrontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
