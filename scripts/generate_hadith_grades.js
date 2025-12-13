const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const OUTPUT = path.join(__dirname, "../hadith_grades_import.sql");

const BASE =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const EDITIONS = [
  "eng-bukhari",
  "eng-muslim",
  "eng-abudawud",
  "eng-tirmidhi",
  "eng-nasai",
  "eng-ibnmajah",
  "eng-malik",
  "eng-ahmad",
  "eng-darimi",
];

async function fetchJson(url) {
  try {
    const res = await axios.get(url, { timeout: 20000 });
    return res.data;
  } catch {
    return null;
  }
}

async function main() {
  console.log("🚀 Generating hadith_graders & hadith_grades SQL...\n");

  const graderSet = new Set();
  const gradeSet = new Set();

  for (const edition of EDITIONS) {
    console.log(`📘 Fetching sample from ${edition}`);

    const data = await fetchJson(`${BASE}/${edition}/1.json`);
    if (!data || !Array.isArray(data.hadiths) || !data.hadiths.length) continue;

    const hadith = data.hadiths[0];

    if (!Array.isArray(hadith.grades)) continue;

    for (const g of hadith.grades) {
      if (g.name) graderSet.add(g.name.trim());
      if (g.grade) gradeSet.add(g.grade.trim());
    }
  }

  let SQL = "-- AUTO GENERATED HADITH GRADERS & GRADES\n\n";

  // ---------- GRADERS ----------
  SQL += "-- INSERT HADITH GRADERS\n";
  SQL += "INSERT INTO hadith_graders (name) VALUES\n";
  SQL += [...graderSet]
    .sort()
    .map(n => `('${n.replace(/'/g, "''")}')`)
    .join(",\n");
  SQL += "\nON CONFLICT (name) DO NOTHING;\n\n";

  // ---------- GRADES ----------
  SQL += "-- INSERT HADITH GRADES\n";
  SQL += "INSERT INTO hadith_grades (name) VALUES\n";
  SQL += [...gradeSet]
    .sort()
    .map(g => `('${g.replace(/'/g, "''")}')`)
    .join(",\n");
  SQL += "\nON CONFLICT (name) DO NOTHING;\n";

  await fs.writeFile(OUTPUT, SQL, "utf8");

  console.log("✅ DONE");
  console.log(`📄 Generated file: ${OUTPUT}`);
  console.log(
    `📊 Total graders: ${graderSet.size}, total grades: ${gradeSet.size}`
  );
}

main();
