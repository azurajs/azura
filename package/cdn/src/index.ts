import { createServer } from "./server";
import type { CDNConfig } from "./types/common";

export function createCDN(config: CDNConfig) {
  const srv = createServer(config);

  return {
    listen(port?: number, host?: string) {
      srv.listen(port, host);
    },
    close(cb?: () => void) {
      srv.close(cb);
    },
    purge(pathname: string) {
      srv.purge(pathname);
    },
    generateSignedUrl(pathname: string, ttlSeconds?: number) {
      return srv.generateSignedUrl(pathname, ttlSeconds);
    },
  };
}

export default createCDN;
