import fs from 'fs';
import path from 'path';

type UploadBucket = 'logos' | 'requests';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const getPublicBaseUrl = () => {
  const fallback = `http://localhost:${process.env.PORT || 5000}`;
  return normalizeBaseUrl(process.env.API_PUBLIC_URL || fallback);
};

export const getUploadsRoot = () => {
  const raw = String(process.env.UPLOAD_PATH ?? '').trim();
  if (!raw) return path.join(process.cwd(), 'uploads');
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
};

export const getUploadsDir = (bucket: UploadBucket) => path.join(getUploadsRoot(), bucket);

export const ensureUploadsDir = (bucket: UploadBucket) => {
  const dir = getUploadsDir(bucket);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

export const buildUploadUrl = (bucket: UploadBucket, fileName: string) => {
  return `${getPublicBaseUrl()}/uploads/${bucket}/${encodeURIComponent(fileName)}`;
};

export const extractUploadFileName = (sourceUrl: string, bucket: UploadBucket): string | null => {
  const match = sourceUrl.match(new RegExp(`/uploads/${bucket}/([^/?#]+)`, 'i'));
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const promoteRequestLogoIfNeeded = (sourceUrl: string) => {
  if (!sourceUrl) return sourceUrl;

  const requestFileName = extractUploadFileName(sourceUrl, 'requests');
  if (!requestFileName) return sourceUrl;

  const sourcePath = path.join(getUploadsDir('requests'), requestFileName);
  if (!fs.existsSync(sourcePath)) return sourceUrl;

  const ext = path.extname(requestFileName) || '.png';
  const promotedName = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const targetDir = ensureUploadsDir('logos');
  const targetPath = path.join(targetDir, promotedName);

  fs.copyFileSync(sourcePath, targetPath);
  return buildUploadUrl('logos', promotedName);
};
