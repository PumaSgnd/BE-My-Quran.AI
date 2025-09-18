require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../models');            // ⬅️ ganti ke models
const { Mission } = db;

if (!Mission) {
    console.error('Mission model belum terdaftar. Cek src/models/index.js');
    process.exit(1);
}

async function main() {
    const jsonPath = path.join(__dirname, '..', 'seeds', 'missions.default.json');
    const missions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const m of missions) {
        const [row, created] = await Mission.findOrCreate({
            where: { code: m.code },
            defaults: {
                title: m.title, description: m.description || null,
                type: m.type, period: m.period,
                target_value: m.target_value || 0,
                base_reward: m.base_reward || 0,
                milestone_rules: m.milestone_rules || null,
                is_active: m.is_active !== false,
                active_from: m.active_from || new Date(),
                active_to: m.active_to || null
            }
        });
        if (!created) {
            await row.update({
                title: m.title, description: m.description || null,
                type: m.type, period: m.period,
                target_value: m.target_value || 0,
                base_reward: m.base_reward || 0,
                milestone_rules: m.milestone_rules || null,
                is_active: m.is_active !== false,
                active_from: m.active_from || row.active_from,
                active_to: m.active_to || null,
                updated_at: db.sequelize.literal('NOW()')
            });
        }
        console.log((created ? 'CREATED ' : 'UPDATED ') + m.code);
    }
    console.log('Seeding missions done ✅');
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
