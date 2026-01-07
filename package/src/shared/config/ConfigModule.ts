import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Config Files Extensions Supported
 * ex: azura.config.*extension
 */

type SupportedConfigFile = ".ts" | ".json" | ".yaml" | ".yml";

export type ConfigTypes = {
  environment?: "development" | "production";
  server?: {
    port?: number;
    cluster?: boolean;
    ipHost?: boolean;
    https?: boolean;
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
   * Recivied error if config file not found or invalid format
   * @param configFiles
   */

  initSync(): void {
    const cdw = process.cwd();
    const configFiles = [
      "azura.config.ts",
      "azura.config.json",
      "azura.config.yaml",
      "azura.config.yml",
    ];

    let loaded = false;
    for (const fileName of configFiles) {
      const filePath = path.join(cdw, fileName);
      if (!existsSync(filePath)) continue;

      const extension = path.extname(fileName) as SupportedConfigFile;
      const raw = readFileSync(filePath, "utf8");

      try {
        let parsed: ConfigTypes;
        switch (extension) {
          case ".ts":
            const mod = require(filePath);
            parsed = mod.default || mod;
            break;
          case ".json":
            parsed = JSON.parse(raw);
            break;
          case ".yaml":
          case ".yml":
            parsed = require("js-yaml").load(raw);
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
