import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    decorators: 'src/decorators/index.ts',
    middleware: 'src/middleware/index.ts',
    types: 'src/types/index.ts',
    infra: 'src/infra/index.ts',
    router: 'src/infra/Router.ts',
    config: 'src/shared/config/index.ts',
    plugins: 'src/shared/plugins/index.ts',
    cors: 'src/shared/plugins/CORSPlugin.ts',
    'rate-limit': 'src/shared/plugins/RateLimitPlugin.ts',
    utils: 'src/utils/index.ts',
    cookies: 'src/utils/cookies/index.ts',
    validators: 'src/utils/validators/index.ts',
    logger: 'src/utils/Logger.ts',
    'http-error': 'src/infra/utils/HttpError.ts',
    swagger: 'src/swagger.ts',
  },

  // Formatos de saída: ESM (modules) e CJS (CommonJS)
  format: ['esm', 'cjs'],

  // Gerar arquivos .d.ts (TypeScript definitions)
  dts: true,

  // Limpar pasta dist antes de cada build
  clean: true,

  // Diretório de saída
  outDir: 'dist',

  // Minificar código (opcional - desabilite para desenvolvimento)
  minify: false,

  // Source maps para debugging
  sourcemap: true,

  // Dividir em chunks para otimização
  splitting: false,

  // Preservar módulos (cada arquivo fonte terá seu próprio arquivo de saída)
  // Desabilite se quiser um bundle único
  treeshake: true,

  // Target do JavaScript
  target: 'es2020',

  // Suporte experimental a decorators
  esbuildOptions(options) {
    options.tsconfig = './tsconfig.build.json';
  },
});
