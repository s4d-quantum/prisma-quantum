/**
 * Test script: downloads a dispatch note PDF for a given order ID
 * and writes it to disk. Similar style to existing test scripts.
 *
 * Usage:
 *   node test-pdf-dispatch-note.js                    # uses default ORDER_ID
 *   ORDER_ID=14199 node test-pdf-dispatch-note.js
 *   BASE_URL=http://localhost:3000 ORDER_ID=14199 node test-pdf-dispatch-note.js
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ORDER_ID = process.env.ORDER_ID || '14199';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
  try {
    console.log('Testing dispatch note PDF generation...');
    const url = `${BASE_URL}/api/goods-out/${ORDER_ID}/dispatch-note`;
    console.log('GET', url);

    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    console.log('Status:', res.status);
    console.log('Headers:', res.headers);

    if (res.status !== 200) {
      const text = Buffer.from(res.data).toString('utf8');
      console.error('Non-200 response. Body (utf8):\n', text);
      process.exit(1);
    }

    const disposition = res.headers['content-disposition'] || '';
    const suggestedNameMatch = disposition.match(/filename="([^"]+)"/);
    const suggestedName = suggestedNameMatch ? suggestedNameMatch[1] : `dispatch-note-${ORDER_ID}.pdf`;

    const outFile = path.resolve(process.cwd(), suggestedName);
    fs.writeFileSync(outFile, res.data);
    console.log(`Saved PDF to ${outFile}`);

    // Basic sanity checks
    const buf = Buffer.from(res.data);
    const startsWithPDF = buf.slice(0, 4).toString('utf8') === '%PDF';
    if (!startsWithPDF) {
      console.warn('Warning: file does not start with %PDF header. Check server response/content-type.');
    } else {
      console.log('PDF header detected (%PDF).');
    }

    if (!res.headers['content-type'] || !res.headers['content-type'].includes('application/pdf')) {
      console.warn('Warning: Missing or incorrect Content-Type header.');
    } else {
      console.log('Content-Type is application/pdf.');
    }

    const len = parseInt(res.headers['content-length'] || '0', 10);
    if (len && len !== buf.length) {
      console.warn(`Warning: content-length header (${len}) does not match buffer length (${buf.length}).`);
    } else {
      console.log(`Content length: ${buf.length} bytes.`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error while testing PDF generation:', err?.message || err);
    process.exit(1);
  }
}

run();