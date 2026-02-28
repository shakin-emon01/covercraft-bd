"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfBuffer = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const generatePdfBuffer = async (url, headers) => {
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
        timeout: 15000,
    });
    const page = await browser.newPage();
    if (headers && Object.keys(headers).length > 0) {
        await page.setExtraHTTPHeaders(headers);
    }
    await page.goto(url, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
};
exports.generatePdfBuffer = generatePdfBuffer;
