import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeCodeforces() {
  console.log('Fetching problems missing editorial text...');
  
  // Target CODEFORCES problems that don't have editorial_text
  const problems = await prisma.problem.findMany({
    where: {
      platform: 'CODEFORCES',
      editorial_text: null
    },
    take: 10 // process in small batches
  });

  if (problems.length === 0) {
    console.log('No Codeforces problems missing editorials. Done.');
    return;
  }

  console.log(`Found ${problems.length} problems to scrape.`);
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

  for (const p of problems) {
    try {
      console.log(`\nScraping [${p.externalId}] ${p.name}...`);
      
      let url = p.url;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(3000); // allow CF checks to pass if any
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      let statementText = '';
      const problemStatement = $('.problem-statement');
      if (problemStatement.length > 0) {
        statementText = problemStatement.text().trim().replace(/\s+/g, ' ');
      }
      
      let tutorialUrl = '';
      $('.roundbox.sidebox a').each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('tutorial') || text.includes('editorial')) {
          tutorialUrl = $(el).attr('href') || '';
        }
      });
      
      if (!tutorialUrl) {
        console.log(`[${p.externalId}] No tutorial link found on problem page.`);
        if (statementText) {
          await prisma.problem.update({
            where: { id: p.id },
            data: { statement_text: statementText }
          });
          console.log(`[${p.externalId}] Updated statement_text only.`);
        }
        continue;
      }
      
      if (!tutorialUrl.startsWith('http')) {
        tutorialUrl = `https://codeforces.com${tutorialUrl}`;
      }
      
      console.log(`[${p.externalId}] Found tutorial link: ${tutorialUrl}. Navigating...`);
      await page.goto(tutorialUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(3000);
      
      const blogHtml = await page.content();
      const $blog = cheerio.load(blogHtml);
      
      const editorialText = $blog('.ttypography').text().trim().replace(/\s+/g, ' ');
      
      if (editorialText) {
        await prisma.problem.update({
          where: { id: p.id },
          data: { 
            statement_text: statementText || null,
            editorial_text: editorialText 
          }
        });
        console.log(`[${p.externalId}] Successfully updated statement and editorial texts.`);
      } else {
        console.log(`[${p.externalId}] Failed to extract editorial text from blog page. HTML length: ${blogHtml.length}`);
        require('fs').writeFileSync('cf_error.html', blogHtml);
      }
      
    } catch (e) {
      console.error(`Error scraping ${p.externalId}:`, e);
    }
  }

  await browser.close();
  console.log('Browser closed.');
}

scrapeCodeforces().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
