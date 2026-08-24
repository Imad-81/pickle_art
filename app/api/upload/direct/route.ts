import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET_NAME, mediaUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${folder}/${Date.now()}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    });

    await s3Client.send(command);
    const publicUrl = mediaUrl(key);

    return NextResponse.json({
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Direct S3 upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file to S3" },
      { status: 500 }
    );
  }
}
