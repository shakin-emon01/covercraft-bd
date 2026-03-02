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
        const query = `search?name=${encodeURIComponent(universityName)}&country=Bangladesh`;
        const hipoUrls = [`https://universities.hipolabs.com/${query}`, `http://universities.hipolabs.com/${query}`];
        let data = null;
        for (const hipoUrl of hipoUrls) {
            try {
                const response = await axios_1.default.get(hipoUrl, { timeout: 10000 });
                data = response.data;
                break;
            }
            catch (error) {
                const canFallbackToHttp = hipoUrl.startsWith('https://') &&
                    axios_1.default.isAxiosError(error) &&
                    ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(error.code ?? '');
                if (!canFallbackToHttp) {
                    throw error;
                }
            }
        }
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
        const reason = axios_1.default.isAxiosError(error)
            ? `${error.code ?? 'AXIOS_ERROR'}: ${error.message}`
            : error instanceof Error
                ? error.message
                : 'Unknown error';
        console.error(`[Logo Sync Failed] Could not fetch logo for ${universityName}: ${reason}`);
        return currentLogoUrl;
    }
};
exports.syncUniversityLogo = syncUniversityLogo;
