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
 * - dateDeployed: "2025-08-22"
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
 * Returns null if the coordinate is 0.00000000, otherwise returns the numeric value
 */
function parseCoordinate(coordStr) {
  if (!coordStr) return null;

  // Extract numeric part from strings like "75.75053947° E"
  const match = coordStr.match(/([0-9.]+)/);
  if (!match) return null;

  const value = parseFloat(match[1]);

  // Return null if coordinate is 0
  if (value === 0) return null;

  return value;
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

  // Use full address as city
  const city = record.Address ? record.Address.trim() : null;

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
    dateDeployed: "2025-08-22",
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
  let withCoordinates = 0;
  let withoutCoordinates = 0;

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
      continue;
    }

    transformed.push(transformedRecord);
    withCoordinates++;
  }

  console.log(`Transformed ${transformed.length} records`);
  console.log(`  - With coordinates: ${withCoordinates}`);
  console.log(`  - Without coordinates (null): ${withoutCoordinates}`);

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
  console.log(`Output written to: ${outputPath}`);

  // Show sample records
  console.log("\nSample records:");
  transformed.slice(0, 3).forEach((rec, idx) => {
    console.log(`\n${idx + 1}. ${rec.name} (${rec.id})`);
    console.log(`   Status: ${rec.status}, Date: ${rec.dateDeployed}`);
    console.log(`   Location: ${rec.location.address.city || "N/A"}`);
    console.log(
      `   Coordinates: ${rec.location.latitude || "null"}, ${
        rec.location.longitude || "null"
      }`
    );
  });
}

main();
