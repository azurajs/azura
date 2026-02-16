import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

/**
 * Config Files Extensions Supported
 * ex: azura.config.*extension
 */
type SupportedConfigFile = ".js" | ".ts" | ".json" | ".yaml" | ".yml";

export type ConfigTypes = {
  name?: string;
  environment?: "development" | "production";
  debug?: boolean;
  server?: {
    port?: number;
    cluster?: boolean;
    clusterInstances?: number;
    ipHost?: boolean;
    https?: boolean;
    /**
     * Configure trust proxy behavior for IP resolution
     * - true: trust all proxies
     * - false: don't trust any proxies (default)
     * - number: trust the nth hop from the front-facing proxy
     * - string: trust specific IP address or CIDR range
     * - string[]: trust multiple IPs or CIDR ranges
     */
    trustProxy?: boolean | number | string | string[];
    /**
     * Custom header name to read IP from
     * @default 'x-forwarded-for'
     */
    ipHeader?: string;
  };
  plugins?: {
    rateLimit?: {
      enabled: boolean;
      limit: number;
      timeframe: number;
    };
    cors?: {
      enabled: boolean;
      origins: string | string[];
      methods: string | string[];
      allowedHeaders: string | string[];
      credentials: boolean;
    };
  };
  logging?: {
    enabled?: boolean;
    showDetails?: boolean;
  };
};

export class ConfigModule {
  private config: ConfigTypes = {};

  /**
   * Load config files first (azura.config.*)
   * Received error if config file not found or invalid format
   */
  initSync(): void {
    const cdw = process.cwd();
    const configFiles = [
      "azura.config.ts",
      "azura.config.js",
      "azura.config.json",
      "azura.config.yaml",
      "azura.config.yml",
    ];

    let loaded = false;

    for (const fileName of configFiles) {
      const filePath = path.join(cdw, fileName);
      if (!existsSync(filePath)) continue;

      const extension = path.extname(fileName) as SupportedConfigFile;

      try {
        let parsed: ConfigTypes;

        switch (extension) {
          case ".ts":
          case ".js":
            // Usa createRequire para manter compatibilidade com ESM
            const require = createRequire(import.meta.url);
            const mod = require(filePath);
            parsed = mod.default || mod;
            break;
          case ".json":
            const raw = readFileSync(filePath, "utf8");
            parsed = JSON.parse(raw);
            break;
          case ".yaml":
          case ".yml":
            const yamlRaw = readFileSync(filePath, "utf8");
            const requireYaml = createRequire(import.meta.url);
            const jsYaml = requireYaml("js-yaml");
            parsed = jsYaml.load(yamlRaw) as ConfigTypes;
            break;
          default:
            throw new Error(`Invalid config file extension: ${extension}`);
        }

        this.config = { ...this.config, ...parsed };
        loaded = true;
        break;
      } catch (error: Error | any) {
        throw new Error(`Error loading config file: ${filePath}\n${error.message}`);
      }
    }

    if (!loaded) {
      throw new Error("Nothing config file found in the current directory.");
    }
  }

  /**
   * Get all configs from loaded config file
   * @returns ConfigTypes
   */
  getAll(): ConfigTypes {
    return this.config;
  }

  /**
   * Return a specific config from loaded config file
   *
   * @template T
   * @param {T} key - key of the config to retrieve
   * @returns {ConfigTypes[T]}
   */
  get<T extends keyof ConfigTypes>(key: T): ConfigTypes[T] {
    return this.config[key];
  }
}
