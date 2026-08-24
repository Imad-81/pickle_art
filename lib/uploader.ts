import imageCompression from "browser-image-compression";

export interface UploadResult {
  url: string;
  key: string;
  type: "image" | "video" | "audio" | "pdf" | "file";
  name: string;
  size: number;
  duration?: number;
  thumbnailUrl?: string;
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (progress: number) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

/**
 * Detect media category from mime type or file extension
 */
export function getMediaType(file: File): "image" | "video" | "audio" | "pdf" | "file" {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(name)) {
    return "image";
  }
  if (type.startsWith("video/") || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(name)) {
    return "video";
  }
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(name)) {
    return "audio";
  }
  if (type === "application/pdf" || /\.pdf$/i.test(name)) {
    return "pdf";
  }
  return "file";
}

/**
 * Browser-level image compression preserving aspect ratio and quality
 */
export async function compressImageInBrowser(
  file: File,
  options: { maxSizeMB?: number; maxWidthOrHeight?: number } = {}
): Promise<File> {
  // Don't compress SVGs or animated GIFs
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  // Only compress if larger than 250KB
  if (file.size <= 250 * 1024) {
    return file;
  }

  try {
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 0.8, // compress to ~800KB
      maxWidthOrHeight: options.maxWidthOrHeight || 2048,
      useWebWorker: true,
      fileType: file.type || "image/jpeg",
    };

    const compressedBlob = await imageCompression(file, compressionOptions);
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("browser-image-compression fallback to original file:", err);
    return file;
  }
}

/**
 * Generate video poster frame in browser
 */
export async function generateVideoPoster(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2 || 0.5);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(video.videoWidth, 800);
          canvas.height = Math.round(
            (canvas.width / (video.videoWidth || 1)) * video.videoHeight
          );
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const posterData = canvas.toDataURL("image/jpeg", 0.7);
            URL.revokeObjectURL(url);
            resolve(posterData);
            return;
          }
        } catch {
          // ignore
        }
        URL.revokeObjectURL(url);
        resolve(undefined);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Main upload function: compresses media in browser, gets pre-signed S3 URL, and uploads directly to AWS S3
 */
export async function uploadMedia(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const mediaType = getMediaType(file);
  let fileToUpload = file;

  // 1. Browser-level Compression for images
  if (mediaType === "image") {
    options.onProgress?.(10);
    fileToUpload = await compressImageInBrowser(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
    });
    options.onProgress?.(30);
  }

  // 2. Video poster extraction
  let posterDataUrl: string | undefined;
  if (mediaType === "video" && typeof window !== "undefined") {
    posterDataUrl = await generateVideoPoster(file);
  }

  options.onProgress?.(40);

  // 3. Request pre-signed S3 URL
  try {
    const presignRes = await fetch("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: fileToUpload.name,
        contentType: fileToUpload.type || "application/octet-stream",
        folder: options.folder || "uploads",
      }),
    });

    if (presignRes.ok) {
      const { uploadUrl, publicUrl, key } = await presignRes.json();

      // 4. Direct PUT to S3
      const s3Upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": fileToUpload.type || "application/octet-stream",
        },
        body: fileToUpload,
      });

      if (s3Upload.ok) {
        options.onProgress?.(100);
        return {
          url: publicUrl,
          key,
          type: mediaType,
          name: file.name,
          size: fileToUpload.size,
          thumbnailUrl: posterDataUrl,
        };
      }
    }
  } catch (err) {
    console.warn("Direct S3 presigned PUT encountered an issue, trying fallback API route:", err);
  }

  // 5. Fallback via /api/upload/direct
  options.onProgress?.(60);
  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("folder", options.folder || "uploads");

  const directRes = await fetch("/api/upload/direct", {
    method: "POST",
    body: formData,
  });

  if (!directRes.ok) {
    const errData = await directRes.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(errData.error || "Failed to upload file to S3");
  }

  const { publicUrl, key } = await directRes.json();
  options.onProgress?.(100);

  return {
    url: publicUrl,
    key,
    type: mediaType,
    name: file.name,
    size: fileToUpload.size,
    thumbnailUrl: posterDataUrl,
  };
}
