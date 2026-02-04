import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { RequestHandler } from "../../types/common.type";

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  path?: string;
  buffer?: Buffer;
}

interface MultipartOptions {
  uploadDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  storeInMemory?: boolean;
}

export function multipart(options: MultipartOptions = {}): RequestHandler {
  const uploadDir = options.uploadDir || "./uploads";
  const maxFileSize = options.maxFileSize || 10 * 1024 * 1024;
  const maxFiles = options.maxFiles || 10;
  const allowedMimeTypes = options.allowedMimeTypes;
  const storeInMemory = options.storeInMemory || false;

  return async (req, res, next) => {
    const contentType = req.headers?.["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      return next ? next() : Promise.resolve();
    }

    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      res.status(400).json({ error: "Invalid multipart boundary" });
      return;
    }

    const boundary = `--${boundaryMatch[1]}`;
    const files: UploadedFile[] = [];
    const fields: Record<string, string> = {};

    try {
      if (!storeInMemory) {
        await mkdir(uploadDir, { recursive: true });
      }

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve());
        req.on("error", reject);
      });

      const buffer = Buffer.concat(chunks);
      const parts = buffer.toString("binary").split(boundary);

      for (const part of parts) {
        if (!part.trim() || part === "--\r\n" || part === "--") continue;

        const headerEndIndex = part.indexOf("\r\n\r\n");
        if (headerEndIndex === -1) continue;

        const headerSection = part.substring(0, headerEndIndex);
        const bodySection = part.substring(headerEndIndex + 4);

        const nameMatch = headerSection.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldname = nameMatch[1];
        const filenameMatch = headerSection.match(/filename="([^"]+)"/);
        const contentTypeMatch = headerSection.match(/Content-Type: ([^\r\n]+)/);

        if (filenameMatch) {
          if (files.length >= maxFiles) {
            res.status(400).json({ error: `Maximum ${maxFiles} files allowed` });
            return;
          }

          const originalname = filenameMatch[1];
          const mimetype = contentTypeMatch
            ? contentTypeMatch[1]?.trim()
            : "application/octet-stream";

          if (allowedMimeTypes && !allowedMimeTypes.includes(mimetype as string)) {
            res.status(400).json({ error: `MIME type ${mimetype} not allowed` });
            return;
          }

          const fileData = bodySection.substring(0, bodySection.lastIndexOf("\r\n"));
          const fileBuffer = Buffer.from(fileData, "binary");

          if (fileBuffer.length > maxFileSize) {
            res.status(400).json({ error: `File size exceeds ${maxFileSize} bytes` });
            return;
          }

          const file: UploadedFile = {
            fieldname: fieldname || "file",
            originalname: originalname || "unknown",
            encoding: "binary",
            mimetype: mimetype || "application/octet-stream",
            size: fileBuffer.length,
          };

          if (storeInMemory) {
            file.buffer = fileBuffer;
          } else {
            const filename = `${Date.now()}-${randomBytes(8).toString("hex")}-${originalname || "file"}`;
            const filepath = join(uploadDir, filename);

            await new Promise<void>((resolve, reject) => {
              const writeStream = createWriteStream(filepath);
              writeStream.write(fileBuffer);
              writeStream.end();
              writeStream.on("finish", resolve);
              writeStream.on("error", reject);
            });

            file.path = filepath;
          }

          files.push(file);
        } else {
          const value = bodySection.substring(0, bodySection.lastIndexOf("\r\n"));
          if (fieldname) {
            fields[fieldname] = value;
          }
        }
      }

      (req as any).files = files;
      (req as any).body = { ...fields, ...(req.body || {}) };

      return next ? next() : Promise.resolve();
    } catch (err: any) {
      res.status(500).json({ error: "File upload failed", message: err.message });
    }
  };
}
