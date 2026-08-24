/**
 * Normalize a stored media URL into a working app URL.
 *
 * "Legacy" items stored the static S3 public URL during upload:
 *   https://<bucket>.s3.<region>.amazonaws.com/<key>
 * which returns 403 because the bucket is private. The current adapter stores
 * the app proxy path: /api/media/<key>. Any legacy S3 URL is rewritten to the
 * proxy path so previously-uploaded media still renders, while external URLs
 * (avatars, data:, blob:, already-proxied paths) are left untouched.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return url ?? "";
  if (
    url.startsWith("/api/media/") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const match = url.match(
    /^https?:\/\/[^./]+\.s3[.-][^/]+\.amazonaws\.com\/(.+)$/i
  );
  if (match) return `/api/media/${match[1]}`;
  return url;
}
