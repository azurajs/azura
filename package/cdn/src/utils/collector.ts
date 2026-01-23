export function collectStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (e) => reject(e));
  });
}
