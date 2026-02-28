import puppeteer from 'puppeteer';

export const generatePdfBuffer = async (
  url: string,
  headers?: Record<string, string>
): Promise<Buffer> => {
  const browser = await puppeteer.launch({
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
