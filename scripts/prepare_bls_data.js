const xlsx = require('xlsx');
const fs = require('fs');

console.log("Loading Excel file (this might take a few seconds)...");
const workbook = xlsx.readFile('./BLS_4_0_2025_DE/BLS_4_0_Daten_2025_DE.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

console.log("Parsing data...");
// Read the raw rows as arrays
const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

if (rawData.length < 2) {
  console.error("No data found.");
  process.exit(1);
}

const headers = rawData[0];

// Find column indices based on substrings to be safe against exact formatting
const findCol = (searchString) => headers.findIndex(h => h && h.toString().includes(searchString));

const idxId = findCol("BLS Code");
const idxName = findCol("Lebensmittelbezeichnung");
const idxKcal = findCol("ENERCC Energie (Kilokalorien)");
const idxProt = findCol("PROT625 Protein");
const idxCarbs = findCol("CHO Kohlenhydrate");
const idxFat = findCol("FAT Fett");
const idxFiber = findCol("FIBT Ballaststoffe");
const idxSugar = findCol("SUGAR Zucker");
const idxSodium = findCol("NA Natrium");

console.log({
  id: idxId, name: idxName, kcal: idxKcal, prot: idxProt, 
  carbs: idxCarbs, fat: idxFat, fiber: idxFiber, sugar: idxSugar, sodium: idxSodium
});

// We need a helper to safely parse numbers
const parseNum = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const num = parseFloat(val.toString().replace(',', '.'));
  return isNaN(num) ? '' : num;
};

const rows = [];
// Create our clean headers
rows.push("id,food_name,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg");

console.log("Processing rows...");
// Skip header row
for (let i = 1; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row[idxId]) continue; // Skip empty rows

  const id = row[idxId];
  // Escape quotes in food name
  let name = row[idxName] || "Unbekannt";
  name = `"${name.replace(/"/g, '""')}"`;

  const kcal = parseNum(row[idxKcal]) || 0;
  const prot = parseNum(row[idxProt]) || 0;
  const carbs = parseNum(row[idxCarbs]) || 0;
  const fat = parseNum(row[idxFat]) || 0;
  const fiber = parseNum(row[idxFiber]);
  const sugar = parseNum(row[idxSugar]);
  const sodium = parseNum(row[idxSodium]);

  rows.push(`${id},${name},${kcal},${prot},${carbs},${fat},${fiber},${sugar},${sodium}`);
}

fs.writeFileSync('bls_import_ready.csv', rows.join('\n'));
console.log(`Success! Created bls_import_ready.csv with ${rows.length - 1} entries.`);
