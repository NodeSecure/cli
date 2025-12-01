// Import Node.js Dependencies
import {
  STATUS_CODES,
  ServerResponse,
  type OutgoingHttpHeaders
} from "node:http";

export interface SendOptions {
  code?: number;
  headers?: OutgoingHttpHeaders;
}

type SendData = string | object;

export function send(
  res: ServerResponse,
  data: SendData = "",
  options: SendOptions = {}
): void {
  const { code = 200, headers = {} } = options;

  let contentType = headers["content-type"] as string | undefined
    ?? res.getHeader("content-type") as string | undefined;

  let body: string;
  if (typeof data === "object") {
    body = JSON.stringify(data);
    contentType ??= "application/json;charset=utf-8";
  }
  else {
    body = data || STATUS_CODES[code] || "";
    contentType ??= "text/plain";
  }

  const finalHeaders = {
    ...headers,
    "content-type": contentType,
    "content-length": Buffer.byteLength(body)
  };

  res.writeHead(code, finalHeaders);
  res.end(body);
}
