const axios = require("axios");
const fs = require("fs");
const path = require("path");

const OUTPUT = path.join(__dirname, "../hadith_grade_relations.sql");

const BASE =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const BOOK_EDITIONS = {
  bukhari: "eng-bukhari",
  muslim: "eng-muslim",
  abudawud: "eng-abudawud",
  tirmidhi: "eng-tirmidhi",
  nasai: "eng-nasai",
  ibnmajah: "eng-ibnmajah",
  malik: "eng-malik",
};

const esc = s => s.replace(/'/g, "''");

async function main() {
  console.log("🚀 Generating hadith_grade_relations.sql (NO DB)\n");

  const sql = [];
  sql.push("-- AUTO GENERATED HADITH GRADE RELATIONS");
  sql.push("BEGIN;");
  sql.push("");

  let total = 0;

  for (const [slug, edition] of Object.entries(BOOK_EDITIONS)) {
    console.log(`📘 Fetching ${edition}.json`);

    const { data } = await axios.get(`${BASE}/${edition}.json`, {
      timeout: 60000,
    });

    for (const h of data.hadiths || []) {
      if (!Array.isArray(h.grades)) continue;

      for (const g of h.grades) {
        if (!g.name || !g.grade) continue;

        sql.push(`
-- ${slug} #${h.hadithnumber}
INSERT INTO hadith_graders (name)
VALUES ('${esc(g.name)}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO hadith_grades (name)
VALUES ('${esc(g.grade)}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO hadith_grade_relations (hadith_id, grader_id, grade_id)
SELECT h.id, gr.id, gd.id
FROM hadith h
JOIN books b ON b.id = h.book_id
JOIN hadith_graders gr ON gr.name = '${esc(g.name)}'
JOIN hadith_grades gd ON gd.name = '${esc(g.grade)}'
WHERE b.slug = '${slug}' AND h.number = ${h.hadithnumber}
ON CONFLICT DO NOTHING;
        `.trim());

        total++;
      }
    }
  }

  sql.push("");
  sql.push("COMMIT;");

  fs.writeFileSync(OUTPUT, sql.join("\n\n"), "utf8");

  console.log("\n✅ DONE");
  console.log(`📄 File generated: ${OUTPUT}`);
  console.log(`➕ Total relations: ${total}`);
}

main().catch(console.error);
