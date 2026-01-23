import http from "http";
import https from "https";
import { URL } from "url";

export function streamFromOrigin(
  originBase: string,
  pathname: string,
  reqHeaders: http.IncomingHttpHeaders,
  onResponse: (
    status: number,
    headers: http.IncomingHttpHeaders,
    stream: NodeJS.ReadableStream,
  ) => void,
  onError: (err: Error) => void,
) {
  const u = new URL(pathname, originBase);
  const lib = u.protocol === "https:" ? https : http;
  const opts = { method: "GET", headers: { ...reqHeaders } };
  const r = lib.request(u, opts, (originRes: http.IncomingMessage) => {
    onResponse(originRes.statusCode || 200, originRes.headers, originRes);
  });
  
  r.on("error", (e) => onError(e));
  r.end();

  return r;
}
