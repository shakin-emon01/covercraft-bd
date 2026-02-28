"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUniversityLogo = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const normalizeName = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const getBestMatch = (items, universityName) => {
    if (!items.length)
        return null;
    const normalizedTarget = normalizeName(universityName);
    const exact = items.find((item) => normalizeName(String(item.name ?? '')) === normalizedTarget);
    if (exact)
        return exact;
    const partial = items.find((item) => {
        const candidate = normalizeName(String(item.name ?? ''));
        return candidate.includes(normalizedTarget) || normalizedTarget.includes(candidate);
    });
    return partial ?? items[0];
};
const normalizeDomainFromUrl = (webUrl) => {
    const safeUrl = webUrl.startsWith('http://') || webUrl.startsWith('https://') ? webUrl : `https://${webUrl}`;
    const domain = new URL(safeUrl).hostname.replace(/^www\./i, '');
    return domain || null;
};
const syncUniversityLogo = async (universityId, universityName, currentLogoUrl) => {
    if (currentLogoUrl && /^https?:\/\//i.test(currentLogoUrl)) {
        return currentLogoUrl;
    }
    try {
        const hipoUrl = `https://universities.hipolabs.com/search?name=${encodeURIComponent(universityName)}&country=Bangladesh`;
        const { data } = await axios_1.default.get(hipoUrl, { timeout: 10000 });
        if (!Array.isArray(data) || data.length === 0) {
            return currentLogoUrl;
        }
        const matched = getBestMatch(data, universityName);
        const webUrl = matched?.web_pages?.[0];
        if (!webUrl)
            return currentLogoUrl;
        const domain = normalizeDomainFromUrl(webUrl);
        if (!domain)
            return currentLogoUrl;
        const newLogoUrl = `https://logo.clearbit.com/${domain}`;
        // Verify the URL is reachable before storing
        const logoRes = await axios_1.default.get(newLogoUrl, {
            timeout: 10000,
            responseType: 'arraybuffer',
            validateStatus: () => true,
        });
        if (logoRes.status < 200 || logoRes.status >= 300) {
            return currentLogoUrl;
        }
        await prisma_1.default.university.update({
            where: { id: universityId },
            data: { logoUrl: newLogoUrl },
        });
        return newLogoUrl;
    }
    catch (error) {
        console.error(`[Logo Sync Failed] Could not fetch logo for ${universityName}:`, error);
        return currentLogoUrl;
    }
};
exports.syncUniversityLogo = syncUniversityLogo;
