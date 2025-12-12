const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

console.log("🚀 Generating FULL SQL with Arabic + Indonesia + Sections...\n");

const OUTPUT = path.join(__dirname, "../hadith_full_import.sql");

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
  } catch {
    return null;
  }
}

async function main() {
  let SQL = "-- INSERT BOOKS\n";

  const validBooks = {};

  // ---- INSERT BOOKS ----
  for (const kitab of Object.keys(BOOKS)) {
    console.log(`📘 Fetching kitab: ${kitab}`);

    const ar = await fetchJson(`${BASE}/${BOOKS[kitab].ar}.json`);
    const id = await fetchJson(`${BASE}/${BOOKS[kitab].id}.json`);

    if (!ar || !id) {
      console.log(`❌ Skip ${kitab} (missing JSON)\n`);
      continue;
    }

    validBooks[kitab] = true;

    const meta = ar.metadata || {};
    const sections = [];

    const names = meta.sections || {}; // nama bab
    const details = meta.section_details || {}; // range hadith

    // CASE 1: kitab punya section_details lengkap
    if (Object.keys(details).length > 0) {
      for (const sid of Object.keys(details)) {
        sections.push({
          id: Number(sid),
          name: names[sid] || "",
          first: details[sid].hadithnumber_first || null,
          last: details[sid].hadithnumber_last || null,
        });
      }
    }

    // CASE 2: hanya punya sections (malik, nasai)
    else if (Object.keys(names).length > 0) {
      for (const sid of Object.keys(names)) {
        sections.push({
          id: Number(sid),
          name: names[sid],
          first: null,
          last: null,
        });
      }
    }

    const sectionsJson = JSON.stringify(sections).replace(/'/g, "''");

    SQL += `INSERT INTO books (slug, title, sections) VALUES ('${kitab}', '${meta.name}', '${sectionsJson}');\n`;
  }

  // ---- INSERT HADITHS ----
  SQL += `\n-- INSERT HADITHS\n`;
  SQL += `INSERT INTO hadith (book_id, number, arab, indo, section)\nVALUES\n`;

  const values = [];

  for (const kitab of Object.keys(BOOKS)) {
    if (!validBooks[kitab]) continue;

    const ar = await fetchJson(`${BASE}/${BOOKS[kitab].ar}.json`);
    const id = await fetchJson(`${BASE}/${BOOKS[kitab].id}.json`);

    const meta = ar.metadata || {};

    const details = meta.section_details || {};
    const sections = [];

    // section ranges
    for (const sid of Object.keys(details)) {
      sections.push({
        id: Number(sid),
        first: details[sid].hadithnumber_first,
        last: details[sid].hadithnumber_last,
      });
    }

    // index search
    ar.hadiths.forEach((h, i) => {
      const num = h.hadithnumber;

      const arab = (h.text || "").replace(/'/g, "''");
      const indo = (id.hadiths[i]?.text || "").replace(/'/g, "''");

      // determine section
      let secId = null;
      for (const sec of sections) {
        if (num >= sec.first && num <= sec.last) {
          secId = sec.id;
          break;
        }
      }

      values.push(`(
        (SELECT id FROM books WHERE slug='${kitab}' LIMIT 1),
        ${num},
        '${arab}',
        '${indo}',
        ${secId}
      )`);
    });

    console.log(`✅ ${kitab} OK (${ar.hadiths.length} hadith)\n`);
  }

  SQL += values.join(",\n") + ";";

  await fs.writeFile(OUTPUT, SQL, "utf8");

  console.log(`🎉 DONE → Generated: ${OUTPUT}`);
}

main();
