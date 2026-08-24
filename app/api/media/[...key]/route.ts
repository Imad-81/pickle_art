import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { s3Client, S3_BUCKET_NAME } from "@/lib/s3";

function parseRange(range: string): { start?: number; end?: number } | null {
  const match = /bytes=(\d*)-(\d*)/.exec(range.trim());
  if (!match) return null;
  const start = match[1] ? parseInt(match[1], 10) : undefined;
  const end = match[2] ? parseInt(match[2], 10) : undefined;
  if (start === undefined && end === undefined) return null;
  return { start, end };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await context.params;
    const key = keyParts.join("/");

    // Guard against path traversal / abuse
    if (!key || key.startsWith("/") || key.includes("..")) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const rangeHeader = req.headers.get("range");
    const range = rangeHeader ? parseRange(rangeHeader) : null;

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ...(range ? { Range: `bytes=${range.start ?? ""}-${range.end ?? ""}` } : {}),
    });

    const result = await s3Client.send(command);
    if (!result.Body) {
      return new NextResponse("Not found", { status: 404 });
    }

    const body = Readable.toWeb(result.Body as Readable) as ReadableStream<Uint8Array>;

    const headers = new Headers();
    headers.set("Content-Type", result.ContentType || "application/octet-stream");
    if (result.ContentLength !== undefined) {
      headers.set("Content-Length", String(result.ContentLength));
    }
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=31536000, immutable");
    if (result.ContentRange) {
      headers.set("Content-Range", result.ContentRange);
    }

    return new NextResponse(body, {
      status: range && result.ContentRange ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Media fetch error:", error);
    return new NextResponse("Failed to load media", { status: 500 });
  }
}
