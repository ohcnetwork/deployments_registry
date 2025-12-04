#!/usr/bin/env node
/**
 * Transform Kerala healthcare facility data to deployment format
 * Usage:
 *   node scripts/transform-keralacare.js --input data1.json --output keralacare-deployments.json
 *
 * Transforms Kerala healthcare facility data into the deployment format:
 * - id: "keralacare-{ID}" format
 * - name: from Name field
 * - description: empty string
 * - program: "keralacare"
 * - location: { latitude, longitude, address: { city, state, country } }
 * - dateDeployed: "2025-03-03"
 * - status: "active"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--input") opts.input = args[++i];
    else if (a === "--output") opts.output = args[++i];
    else if (a === "--help") opts.help = true;
  }
  return opts;
}

function showHelp() {
  console.log(`Transform Kerala healthcare facility data to deployment format

Usage:
  node scripts/transform-keralacare.js --input <file> --output <file>

Options:
  --input <file>    Path to source data1.json (default: data1.json)
  --output <file>   Path to output JSON file (default: keralacare-deployments.json)
  --help            Show this help message
`);
}

/**
 * Parse coordinate string like "75.75053947° E" or "0.00000000° N"
 * Returns null if the coordinate is 0.00000000 or very close to zero (< 1.0)
 * These small values are typically data errors, not real coordinates
 */
function parseCoordinate(coordStr) {
  if (!coordStr) return null;

  // Extract numeric part from strings like "75.75053947° E"
  const match = coordStr.match(/([0-9.]+)/);
  if (!match) return null;

  const value = parseFloat(match[1]);

  // Return null if coordinate is 0 or very small (< 1.0)
  // Kerala coordinates are typically 8-13 for latitude and 74-78 for longitude
  // Any value less than 1.0 is likely a data error or missing coordinate
  if (value < 1.0) return null;

  return value;
}

/**
 * Check if coordinates are within Kerala bounds
 * Kerala approximate bounds:
 * Latitude: 8.2°N to 12.8°N
 * Longitude: 74.8°E to 77.5°E
 */
function isInKerala(latitude, longitude) {
  if (latitude === null || longitude === null) return false;
  
  const KERALA_BOUNDS = {
    minLat: 8.2,
    maxLat: 12.8,
    minLon: 74.8,
    maxLon: 77.5
  };

  return (
    latitude >= KERALA_BOUNDS.minLat &&
    latitude <= KERALA_BOUNDS.maxLat &&
    longitude >= KERALA_BOUNDS.minLon &&
    longitude <= KERALA_BOUNDS.maxLon
  );
}

/**
 * Extract city name from address string
 * Attempts to extract the most specific location (usually city/town)
 * from addresses like "FHC Chathalloor, Chathalloor PO , Othayi, Malappuram 676541"
 */
function extractCity(address) {
  if (!address) return null;

  // Clean the address
  const cleaned = address
    .replace(/\n/g, ", ") // Replace newlines with commas
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();

  // Split by comma
  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p);

  if (parts.length === 0) return null;

  // Common patterns to filter out or clean
  const excludePatterns = [
    /^PIN\s*\d*/i, // PIN with or without number
    /^\d{3}[,\s]*\d{3}$/, // Pincode format like "673,001"
    /^(FHC|PHC|CHC|UHC|UPHC|GH|DH|TALUK|DISTRICT)\s/i, // Facility type prefixes at start
    /^(P\s*O|POST OFFICE|NEAR|OPPOSITE|AT|ABOVE|BELOW)\s/i, // Common location descriptors
    /^(KERALA|INDIA)$/i, // State/country names
    /^\s*-\s*$/, // Just a dash
  ];

  // Filter and clean parts
  const filteredParts = parts
    .map((part) => {
      // Remove pincode from end of part (e.g., "Malappuram 676541" -> "Malappuram")
      let cleaned = part.replace(/\s*\d{6}\s*$/, "").trim();
      // Remove trailing dash and spaces
      cleaned = cleaned.replace(/\s*-\s*$/, "").trim();
      return cleaned;
    })
    .filter((part) => {
      // Skip very short parts
      if (part.length < 3) return false;

      // Skip parts matching exclude patterns
      return !excludePatterns.some((pattern) => pattern.test(part));
    });

  if (filteredParts.length === 0) {
    // If no parts remain, try to extract last meaningful word from original
    const words = cleaned.split(/\s+/);
    const lastWords = words.slice(-3).join(" ");
    return lastWords.replace(/\s*\d{6}\s*$/, "").trim() || cleaned;
  }

  // Return the last filtered part (usually city/district name)
  return filteredParts[filteredParts.length - 1];
}

/**
 * Transform a single record from input format to output format
 */
function transformRecord(record) {
  const id = `keralacare-${record.ID}`;
  const name = record.Name || "Unknown Facility";
  const description = "";
  const program = "keralacare";

  // Parse coordinates
  let longitude = parseCoordinate(record.Longitude);
  let latitude = parseCoordinate(record.Latitude);

  // If either latitude or longitude is null, set both to null
  if (latitude === null || longitude === null) {
    latitude = null;
    longitude = null;
  }

  // Extract city from address instead of using full address
  const city = extractCity(record.Address);
  const fullAddress = record.Address ? record.Address.trim() : null;

  return {
    id,
    name: name.trim(),
    description,
    program,
    location: {
      latitude,
      longitude,
      address: {
        city,
        state: "Kerala",
        country: "India",
      },
    },
    fullAddress, // Keep full address for reference in invalid records
    dateDeployed: "2025-03-03",
    status: "active",
  };
}

function main() {
  const opts = parseArgs();

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  // Set defaults
  const inputPath = opts.input || path.join(__dirname, "..", "data1.json");
  const outputPath =
    opts.output || path.join(__dirname, "..", "keralacare-deployments.json");
  const invalidPath = outputPath.replace('.json', '-invalid.json');

  // Read input file
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Reading from: ${inputPath}`);
  const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  if (!Array.isArray(rawData)) {
    console.error("Error: Input file must contain a JSON array");
    process.exit(1);
  }

  console.log(`Found ${rawData.length} records`);

  // Transform records
  const transformed = [];
  const invalidRecords = [];
  let withCoordinates = 0;
  let withoutCoordinates = 0;
  let outsideKerala = 0;

  for (const record of rawData) {
    if (!record.ID) {
      console.warn(`Skipping record without ID: ${record.Name || "Unknown"}`);
      continue;
    }

    const transformedRecord = transformRecord(record);

    // Skip records without valid coordinates
    if (
      transformedRecord.location.latitude === null ||
      transformedRecord.location.longitude === null
    ) {
      withoutCoordinates++;
      invalidRecords.push({
        ...transformedRecord,
        reason: "Missing or invalid coordinates",
        originalAddress: transformedRecord.fullAddress,
      });
      continue;
    }

    // Check if coordinates are within Kerala bounds
    if (!isInKerala(transformedRecord.location.latitude, transformedRecord.location.longitude)) {
      outsideKerala++;
      invalidRecords.push({
        ...transformedRecord,
        reason: "Coordinates outside Kerala bounds",
        originalAddress: transformedRecord.fullAddress,
      });
      continue;
    }

    // Remove fullAddress from valid records before saving
    delete transformedRecord.fullAddress;
    transformed.push(transformedRecord);
    withCoordinates++;
  }

  console.log(`Transformed ${transformed.length} records`);
  console.log(`  - With valid coordinates in Kerala: ${withCoordinates}`);
  console.log(`  - Without coordinates (null): ${withoutCoordinates}`);
  console.log(`  - Outside Kerala bounds: ${outsideKerala}`);
  console.log(`  - Total invalid records: ${invalidRecords.length}`);

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
  console.log(`Output written to: ${outputPath}`);

  // Write invalid records to separate file
  if (invalidRecords.length > 0) {
    fs.writeFileSync(invalidPath, JSON.stringify(invalidRecords, null, 2));
    console.log(`Invalid records written to: ${invalidPath}`);
  }

  // Show sample records
  console.log("\nSample valid records:");
  transformed.slice(0, 3).forEach((rec, idx) => {
    console.log(`\n${idx + 1}. ${rec.name} (${rec.id})`);
    console.log(`   Status: ${rec.status}, Date: ${rec.dateDeployed}`);
    console.log(`   City: ${rec.location.address.city || "N/A"}`);
    console.log(
      `   Coordinates: ${rec.location.latitude || "null"}, ${
        rec.location.longitude || "null"
      }`
    );
  });

  if (invalidRecords.length > 0) {
    console.log("\nSample invalid records:");
    invalidRecords.slice(0, 3).forEach((rec, idx) => {
      console.log(`\n${idx + 1}. ${rec.name} (${rec.id})`);
      console.log(`   Reason: ${rec.reason}`);
      console.log(`   Original Address: ${rec.originalAddress || "N/A"}`);
      console.log(
        `   Coordinates: ${rec.location.latitude || "null"}, ${
          rec.location.longitude || "null"
        }`
      );
    });
  }
}

main();
