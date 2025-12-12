const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

console.log("🚀 Generating full SQL dump with FIXED CDN URLs...\n");

const OUTPUT = path.join(__dirname, "../hadith_full_import.sql");

// Mapping kitab → edition Arab + Indonesia
const BOOKS = {
  bukhari: { ar: "ara-bukhari", id: "ind-bukhari" },
  muslim: { ar: "ara-muslim", id: "ind-muslim" },
  nasai: { ar: "ara-nasai", id: "ind-nasai" },
  tirmidhi: { ar: "ara-tirmidhi", id: "ind-tirmidhi" },
  abudawud: { ar: "ara-abudawud", id: "ind-abudawud" },
  ibnmajah: { ar: "ara-ibnmajah", id: "ind-ibnmajah" },
  malik: { ar: "ara-malik", id: "ind-malik" },
  ahmad: { ar: "ara-ahmad", id: "ind-ahmad" },
  darimi: { ar: "ara-darimi", id: "ind-darimi" },
};

const BASE =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

async function fetchJson(url) {
  try {
    const res = await axios.get(url, { timeout: 20000 });
    return res.data;
  } catch (err) {
    return null;
  }
}

async function main() {
  let SQL = "INSERT INTO hadiths (book, number, arab, indo) VALUES\n";

  for (const kitab of Object.keys(BOOKS)) {
    console.log(`📘 Fetching kitab: ${kitab}`);

    const arUrl = `${BASE}/${BOOKS[kitab].ar}.json`;
    const idUrl = `${BASE}/${BOOKS[kitab].id}.json`;

    const arab = await fetchJson(arUrl);
    const indo = await fetchJson(idUrl);

    if (!arab || !indo) {
      console.log(`⚠️ Skip ${kitab} (JSON tidak ditemukan di CDN)\n`);
      continue;
    }

    const arabList = arab.hadiths;
    const indoList = indo.hadiths;

    arabList.forEach((h, idx) => {
      const num = h.hadithnumber;

      const textAr = h.text?.replace(/'/g, "''") || "";
      const textId = indoList[idx]?.text?.replace(/'/g, "''") || "";

      SQL += `('${kitab}', ${num}, '${textAr}', '${textId}'),\n`;
    });

    console.log(`✅ ${kitab} OK (${arabList.length} hadith loaded)\n`);
  }

  // Cleaning SQL (remove last comma → add semicolon)
  SQL = SQL.trim().replace(/,$/, ";");

  await fs.writeFile(OUTPUT, SQL, "utf8");

  console.log(`🎉 Done. File generated: ${OUTPUT}`);
}

main();
