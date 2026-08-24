import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET_NAME, mediaUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType, folder = "uploads" } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    // Generate clean unique key
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${folder}/${Date.now()}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = mediaUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
