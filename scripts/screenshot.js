import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 400 });
  const filePath = path.join(__dirname, '../frontpage.html');
  await page.goto(`file://${filePath}`);
  await page.screenshot({ path: path.join(__dirname, '../assets/img/brand-icon.png'), clip: { x: 0, y: 0, width: 800, height: 400 } });
  await browser.close();
  console.log('Brand icon PNG created: brand-icon.png');
})();