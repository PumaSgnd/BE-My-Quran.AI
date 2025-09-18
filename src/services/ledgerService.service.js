const db = require('../models');                 // ⬅️
const { UserWallet, RewardLedger, sequelize } = db;

async function ensureWallet(userId, t) {
    await UserWallet.findOrCreate({ where: { user_id: userId }, defaults: { stars: 0 }, transaction: t });
}
async function addStars(userId, delta, metadata = {}, source = 'mission_claim', sourceRef = null) {
    return sequelize.transaction(async (t) => {
        await ensureWallet(userId, t);
        const w = await UserWallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
        const after = (w.stars || 0) + delta;
        await w.update({ stars: after, updated_at: sequelize.literal('NOW()') }, { transaction: t });
        await RewardLedger.create({ user_id: userId, source, source_ref: sourceRef, points_change: delta, balance_after: after, metadata }, { transaction: t });
        return { balance: after };
    });
}
async function getWallet(userId) {
    const [w] = await UserWallet.findOrCreate({ where: { user_id: userId }, defaults: { stars: 0 } });
    return { stars: w.stars };
}
module.exports = { addStars, getWallet };
