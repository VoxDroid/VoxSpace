import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  // Go to the app
  await page.goto('http://localhost:3000');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for app to load

  // Take screenshot of the main interface
  await page.screenshot({ path: path.join(__dirname, '../assets/img/screenshot-main.png'), fullPage: false });

  // Try to take another screenshot with different shape or something
  // But since it's interactive, perhaps just one for now

  await browser.close();
  console.log('Screenshots created in assets/img/');
})();