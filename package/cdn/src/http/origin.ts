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
): http.ClientRequest {
  const url = new URL(pathname, originBase);
  const lib = url.protocol === "https:" ? https : http;

  const headers = { ...reqHeaders };
  delete headers.host;

  const opts = { method: "GET", headers };

  const request = lib.request(url, opts, (originRes: http.IncomingMessage) => {
    onResponse(originRes.statusCode || 200, originRes.headers, originRes);
  });

  request.on("error", (e) => onError(e));
  request.end();

  return request;
}
