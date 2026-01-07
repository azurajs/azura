import type { ConfigTypes } from "../package/src/shared/config/ConfigModule";

const config: ConfigTypes = {
  environment: "development",
  server: {
    port: 3000,
    cluster: false,
    ipHost: false,
    https: false,
  },
  plugins: {
    rateLimit: {
      enabled: true,
      limit: 100,
      timeframe: 60000, // 1 minuto em ms
    },
    cors: {
      enabled: true,
      origins: ["*"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  },
  logging: {
    enabled: true,
    showDetails: true,
  },
};

export default config;
