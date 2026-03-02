"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoteRequestLogoIfNeeded = exports.extractUploadFileName = exports.buildUploadUrl = exports.ensureUploadsDir = exports.getUploadsDir = exports.getUploadsRoot = exports.getPublicBaseUrl = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');
const getPublicBaseUrl = () => {
    const fallback = `http://localhost:${process.env.PORT || 5000}`;
    return normalizeBaseUrl(process.env.API_PUBLIC_URL || fallback);
};
exports.getPublicBaseUrl = getPublicBaseUrl;
const getUploadsRoot = () => {
    const raw = String(process.env.UPLOAD_PATH ?? '').trim();
    if (!raw)
        return path_1.default.join(process.cwd(), 'uploads');
    return path_1.default.isAbsolute(raw) ? raw : path_1.default.join(process.cwd(), raw);
};
exports.getUploadsRoot = getUploadsRoot;
const getUploadsDir = (bucket) => path_1.default.join((0, exports.getUploadsRoot)(), bucket);
exports.getUploadsDir = getUploadsDir;
const ensureUploadsDir = (bucket) => {
    const dir = (0, exports.getUploadsDir)(bucket);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
};
exports.ensureUploadsDir = ensureUploadsDir;
const buildUploadUrl = (bucket, fileName) => {
    return `${(0, exports.getPublicBaseUrl)()}/uploads/${bucket}/${encodeURIComponent(fileName)}`;
};
exports.buildUploadUrl = buildUploadUrl;
const extractUploadFileName = (sourceUrl, bucket) => {
    const match = sourceUrl.match(new RegExp(`/uploads/${bucket}/([^/?#]+)`, 'i'));
    if (!match?.[1])
        return null;
    try {
        return decodeURIComponent(match[1]);
    }
    catch {
        return match[1];
    }
};
exports.extractUploadFileName = extractUploadFileName;
const promoteRequestLogoIfNeeded = (sourceUrl) => {
    if (!sourceUrl)
        return sourceUrl;
    const requestFileName = (0, exports.extractUploadFileName)(sourceUrl, 'requests');
    if (!requestFileName)
        return sourceUrl;
    const sourcePath = path_1.default.join((0, exports.getUploadsDir)('requests'), requestFileName);
    if (!fs_1.default.existsSync(sourcePath))
        return sourceUrl;
    const ext = path_1.default.extname(requestFileName) || '.png';
    const promotedName = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetDir = (0, exports.ensureUploadsDir)('logos');
    const targetPath = path_1.default.join(targetDir, promotedName);
    fs_1.default.copyFileSync(sourcePath, targetPath);
    return (0, exports.buildUploadUrl)('logos', promotedName);
};
exports.promoteRequestLogoIfNeeded = promoteRequestLogoIfNeeded;
