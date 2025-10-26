/**
 * MATRADE Dataset Downloader
 * Downloads CSV/Excel files from archive.data.gov.my
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRIORITY_DATASETS } from './datasets-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const METADATA_FILE = path.join(__dirname, 'downloads', 'metadata.json');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

/**
 * Scrape the dataset page to find download links
 */
async function findDownloadLinks(datasetUrl) {
  console.log(`  Fetching dataset page: ${datasetUrl}`);

  try {
    const response = await axios.get(datasetUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const downloads = [];

    // Look for download links (CSV, Excel, etc.)
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();

      if (href && (
        href.includes('.csv') ||
        href.includes('.xls') ||
        href.includes('.xlsx') ||
        href.includes('download') ||
        text.toLowerCase().includes('download') ||
        text.toLowerCase().includes('csv') ||
        text.toLowerCase().includes('excel')
      )) {
        // Make URL absolute if needed
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = 'http://archive.data.gov.my' + href;
        } else if (!href.startsWith('http')) {
          fullUrl = 'http://archive.data.gov.my/data/en_US/dataset/' + href;
        }

        downloads.push({
          url: fullUrl,
          text: text,
          type: href.includes('.csv') ? 'csv' : (href.includes('.xls') ? 'excel' : 'unknown')
        });
      }
    });

    return downloads;
  } catch (error) {
    console.error(`  ❌ Error fetching ${datasetUrl}:`, error.message);
    return [];
  }
}

/**
 * Download a file from URL
 */
async function downloadFile(url, outputPath) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    fs.writeFileSync(outputPath, response.data);
    return true;
  } catch (error) {
    console.error(`  ❌ Download failed:`, error.message);
    return false;
  }
}

/**
 * Main download function
 */
async function downloadDatasets() {
  console.log('🌐 MATRADE Dataset Downloader\n');
  console.log(`Downloading ${PRIORITY_DATASETS.length} priority datasets...\n`);

  const metadata = {
    downloadDate: new Date().toISOString(),
    datasets: []
  };

  let successCount = 0;
  let errorCount = 0;

  for (const dataset of PRIORITY_DATASETS) {
    console.log(`\n[${ dataset.priority === 1 ? '⭐' : '  ' }] ${dataset.name}`);
    console.log(`    Sector: ${dataset.sector}`);
    console.log(`    Type: ${dataset.type}`);

    // Find download links on the dataset page
    const downloadLinks = await findDownloadLinks(dataset.url);

    if (downloadLinks.length === 0) {
      console.log(`  ⚠️  No download links found`);
      errorCount++;
      continue;
    }

    console.log(`  Found ${downloadLinks.length} download link(s)`);

    // Download the first CSV or Excel file
    const fileLink = downloadLinks.find(dl => dl.type === 'csv') ||
                     downloadLinks.find(dl => dl.type === 'excel') ||
                     downloadLinks[0];

    if (!fileLink) {
      console.log(`  ⚠️  No suitable file format found`);
      errorCount++;
      continue;
    }

    // Determine file extension
    const ext = fileLink.type === 'csv' ? '.csv' :
                fileLink.type === 'excel' ? '.xlsx' :
                '.dat';

    const filename = `${dataset.id}${ext}`;
    const outputPath = path.join(DOWNLOADS_DIR, filename);

    console.log(`  📥 Downloading: ${fileLink.text || 'data file'}`);
    console.log(`     URL: ${fileLink.url.substring(0, 80)}...`);

    const success = await downloadFile(fileLink.url, outputPath);

    if (success) {
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  ✅ Downloaded: ${filename} (${sizeMB} MB)`);

      metadata.datasets.push({
        id: dataset.id,
        name: dataset.name,
        sector: dataset.sector,
        type: dataset.type,
        filename: filename,
        fileSize: stats.size,
        downloadUrl: fileLink.url,
        downloadDate: new Date().toISOString()
      });

      successCount++;
    } else {
      errorCount++;
    }

    // Be polite - delay between downloads
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Save metadata
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('📊 DOWNLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total datasets: ${PRIORITY_DATASETS.length}`);
  console.log(`Successfully downloaded: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nFiles saved to: ${DOWNLOADS_DIR}`);
  console.log(`Metadata saved to: ${METADATA_FILE}`);
  console.log('='.repeat(70) + '\n');

  console.log('📝 NEXT STEPS:');
  console.log('1. Review downloaded files in downloads/');
  console.log('2. Run: npm run parse');
  console.log('3. Run: npm run transform');
  console.log('4. Run: npm run seed\n');
}

// Run downloader
downloadDatasets().catch(console.error);
