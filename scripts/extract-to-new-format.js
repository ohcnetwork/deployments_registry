#!/usr/bin/env node
/**
 * Extract and transform data from data.json to new JSON format
 * Usage:
 *   node scripts/extract-to-new-format.js --input data.json --output output.json
 *
 * Transforms hospital data from data.json into the new deployment format:
 * - id: "10bed-{state}-{number}" format
 * - name: from hospital_name
 * - description: from summary
 * - program: "10bedicu"
 * - location: { latitude, longitude, address: { city, state, country } }
 * - dateDeployed: from launch_date (parsed to YYYY-MM-DD or null)
 * - status: from status (Live -> active, Yet to start -> planned, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--input') opts.input = args[++i];
    else if (a === '--output') opts.output = args[++i];
    else if (a === '--help') opts.help = true;
  }
  return opts;
}

function showHelp() {
  console.log(`Extract and transform data from data.json to new format

Usage:
  node scripts/extract-to-new-format.js --input <file> --output <file>

Options:
  --input <file>    Path to source data.json (default: data.json)
  --output <file>   Path to output JSON file (default: deployments-new.json)
  --help            Show this help message
`);
}

function sanitize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function parseDate(raw) {
  if (!raw) return null;
  let s = raw.trim();
  if (!s || /^(tbd|na|n\/a)$/i.test(s)) return null;
  
  // Format: D-Mon-YYYY (e.g., "7-Jan-2022")
  const m4 = s.match(/^(\d{1,2})[-\s]+([A-Za-z]{3,})[-\s]+(\d{4})$/);
  if (m4) {
    const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const monthAbbrev = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    let [_, d, mon, y] = m4;
    let mi = monthNames.indexOf(mon.toLowerCase());
    if (mi === -1) {
      mi = monthAbbrev.indexOf(mon.toLowerCase().slice(0, 3));
    }
    if (mi !== -1) {
      return `${y}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
  }
  
  // Format: DD/MM/YYYY or DD/MM/YY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m1) {
    let [_, d, m, y] = m1;
    if (y.length === 2) y = '20' + y; // assume 20xx
    const day = String(d).padStart(2, '0');
    const month = String(m).padStart(2, '0');
    return `${y}-${month}-${day}`;
  }
  
  // Format: D Month, YYYY
  const m2 = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s*,?\s*(\d{4})$/);
  if (m2) {
    const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    let [_, d, mon, y] = m2;
    const mi = monthNames.indexOf(mon.toLowerCase());
    if (mi !== -1) {
      return `${y}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
  }
  
  // Format: Month YYYY (assume first day)
  const m3 = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m3) {
    const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const mi = monthNames.indexOf(m3[1].toLowerCase());
    if (mi !== -1) {
      return `${m3[2]}-${String(mi+1).padStart(2,'0')}-01`;
    }
  }
  
  return null;
}

function mapStatus(raw) {
  if (!raw) return 'active';
  const s = raw.trim().toLowerCase();
  if (s === 'live' || s === 'live.') return 'active';
  if (s === 'yet to start' || s === 'yet to start.') return 'planned';
  return 'active'; // default to active
}

function extractCityName(district, hospitalName) {
  // Try to extract city name from district or hospital name
  let city = district || hospitalName || 'Unknown';
  
  // Remove common prefixes like "DH,", "District Hospital,", etc.
  city = city.replace(/^(DH\s*,?\s*)/i, '')
             .replace(/^(District\s+Hospital\s*,?\s*)/i, '')
             .replace(/^(GH\s*,?\s*)/i, '')
             .replace(/^(Government\s+Hospital\s*,?\s*)/i, '')
             .trim();
  
  // Handle comma-separated names (e.g., "DH,Churachandpur" -> "Churachandpur")
  // Take the part after the first comma if it exists and is meaningful
  const parts = city.split(',');
  if (parts.length > 1 && parts[0].trim().length < 5) {
    // If first part is short (like "DH"), use the part after comma
    city = parts.slice(1).join(',').trim();
  } else if (parts.length > 1) {
    // If first part is meaningful, use it
    city = parts[0].trim();
  }
  
  // If empty after cleaning, use original district
  if (!city) city = district || hospitalName || 'Unknown';
  
  // Capitalize first letter of each word
  return city.split(' ').map(word => capitalizeFirst(word)).join(' ');
}

function transformRecord(record, stateCounter) {
  // Support both old format (state, district) and new format (state_key, district_key)
  const state = ((record.state_key || record.state) || '').toString().toLowerCase();
  const sanitizedState = sanitize(state);
  
  // Generate ID: "10bed-{state}-{number}"
  const counter = stateCounter.get(state) || 0;
  const number = String(counter + 1).padStart(3, '0');
  const id = `10bed-${sanitizedState}-${number}`;
  stateCounter.set(state, counter + 1);
  
  // Extract fields - support both old and new field names
  const district = record.district_key || record.district || '';
  const name = record.hospital_name || district || 'Unknown Hospital';
  const description = record.summary || '';
  const latitude = record.latitude ? parseFloat(record.latitude) : null;
  const longitude = record.longitude ? parseFloat(record.longitude) : null;
  const dateDeployed = parseDate(record.launch_date);
  const status = mapStatus(record.status);
  
  // Extract city from district or hospital name
  const city = extractCityName(district, record.hospital_name);
  const stateFormatted = state ? state.split(' ').map(word => capitalizeFirst(word)).join(' ') : '';
  
  return {
    id,
    name: name.trim(),
    description: description.trim() || null,
    program: '10bedicu',
    location: {
      latitude: latitude || null,
      longitude: longitude || null,
      address: {
        city: city || null,
        state: stateFormatted || null,
        country: 'India'
      }
    },
    dateDeployed: dateDeployed || null,
    status: status
  };
}

function main() {
  const opts = parseArgs();
  
  if (opts.help) {
    showHelp();
    process.exit(0);
  }
  
  // Set defaults
  const inputPath = opts.input || path.join(__dirname, '..', 'data.json');
  const outputPath = opts.output || path.join(__dirname, '..', 'deployments-new.json');
  
  // Read input file
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  console.log(`Reading from: ${inputPath}`);
  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  if (!Array.isArray(rawData)) {
    console.error('Error: Input file must contain a JSON array');
    process.exit(1);
  }
  
  console.log(`Found ${rawData.length} records`);
  
  // Transform records
  const stateCounter = new Map(); // Track counter per state
  const transformed = [];
  
  for (const record of rawData) {
    // Skip records without state (support both old and new field names)
    const state = record.state_key || record.state;
    if (!state) {
      console.warn(`Skipping record without state: ${record.hospital_name || 'Unknown'}`);
      continue;
    }
    
    const transformedRecord = transformRecord(record, stateCounter);
    transformed.push(transformedRecord);
  }
  
  console.log(`Transformed ${transformed.length} records`);
  
  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
  console.log(`Output written to: ${outputPath}`);
  
  // Show sample
  console.log('\nSample records:');
  transformed.slice(0, 3).forEach((rec, idx) => {
    console.log(`\n${idx + 1}. ${rec.name} (${rec.id})`);
    console.log(`   Status: ${rec.status}, Location: ${rec.location.address.city}, ${rec.location.address.state}`);
  });
}

main();

