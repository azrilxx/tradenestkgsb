import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugScrape() {
  console.log('🔍 Starting debug scraper...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  const testUrl = 'https://www.fmm.org.my/Member_Detail.aspx?MemberId=33B2D787-43F1-4E3B-93A3-97F28E296CE8';

  try {
    console.log(`Navigating to: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'output/debug-screenshot.png', fullPage: true });

    console.log('Extracting page HTML structure...');
    const htmlStructure = await page.evaluate(() => {
      return document.body.innerHTML;
    });

    fs.writeFileSync('output/debug-page.html', htmlStructure);
    console.log('✓ Saved page HTML to output/debug-page.html');

    console.log('\nExtracting all table rows...');
    const tableData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      return rows.map((row, index) => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          rowIndex: index,
          cellCount: cells.length,
          cell0: cells[0] ? cells[0].textContent.trim() : '',
          cell1: cells[1] ? cells[1].textContent.trim() : ''
        };
      }).filter(r => r.cellCount > 0);
    });

    console.log('\nTable structure:');
    console.log(JSON.stringify(tableData, null, 2));

    fs.writeFileSync('output/debug-table-data.json', JSON.stringify(tableData, null, 2));
    console.log('\n✓ Saved table data to output/debug-table-data.json');

    console.log('\nPress Ctrl+C to close the browser...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugScrape().catch(console.error);
