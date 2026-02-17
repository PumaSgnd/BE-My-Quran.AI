const db = require('../config/db');

const getHijriMonth = (date = new Date(), tz = 'Asia/Jakarta') =>
    Number(
        new Intl.DateTimeFormat(
            'en-u-ca-islamic',
            { month: 'numeric', timeZone: tz }
        ).format(date)
    );

const isRamadhan = (date = new Date(), tz = 'Asia/Jakarta') =>
    getHijriMonth(date, tz) === 9;

const ACHIEVEMENTS = {
    UNIQUE: {
        ALL_BADGES: {
            title: "Kunci Ka'bah",
            subtitle: "Dapatkan semua lencana"
        },
        FIRST_PLAN: {
            title: "Jabal Nur",
            subtitle: "Buat rencana Khatam pertama"
        },
        FIRST_JOIN_QURAN: {
            title: "Iqra",
            subtitle: "Gabung baca Al-Quran pertama"
        }
    },

    INDIVIDUAL: {
        KHATAM: {
            title: "Sibaha",
            subtitle: "Khatam secara Individual"
        },
        KHATAM_FAST: {
            title: "Fursan",
            subtitle: "Khatam secara individual sebelum batas waktu habis"
        }
    },

    GROUP: {
        COMPLETE_GROUP: {
            title: "Halaqah",
            subtitle: "Selesaikan membaca Al-Quran secara berkelompok"
        },
        COMPLETE_GROUP_ALT: {
            title: "Ukhuwah",
            subtitle: "Selesaikan membaca Al-Quran secara berkelompok"
        },
        CREATE_GROUP: {
            title: "Sibaaq",
            subtitle: "Berhasil membuat grup"
        },
        COMPLETE_GROUP_FAST: {
            title: "Fawz",
            subtitle: "Selesaikan bacaan Al-Quran secara berkelompok sebelum batas waktu habis"
        }
    },

    RAMADAN: {
        JOIN_3_GROUP: {
            title: "Jamaah",
            subtitle: "Bergabung dengan grup yang terdiri dari 3 orang atau lebih"
        },
        CREATE_3_GROUP: {
            title: "Marhaban",
            subtitle: "Berhasil membuat grup yang terdiri dari 3 orang atau lebih"
        },
        KHATAM_RAMADAN: {
            title: "Mabruk",
            subtitle: "Selesaikan bacaan Al-Quran selama Ramadhan"
        }
    }
};

const unlock = async (userId, ach) => {
    return unlockAchievement(
        userId,
        ach.title,
        ach.subtitle
    );
};

const unlockAchievement = async (userId, title, subtitle) => {
    try {

        const master = await db.query(`
            SELECT id
            FROM khatam_achievements_master
            WHERE title = $1
            AND subtitle = $2
            LIMIT 1
        `, [title, subtitle]);

        if (!master.rows.length) return;

        const achievementId = master.rows[0].id;

        await db.query(`
            INSERT INTO khatam_user_achievements
            (user_id, achievement_id, is_owned, owned_at)
            VALUES ($1, $2, true, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, achievement_id)
            DO NOTHING
        `, [userId, achievementId]);

    } catch (err) {
        console.error('Unlock achievement error:', err);
    }
};

const checkUnlockAllAchievement = async (userId) => {
    try {

        const totalMaster = await db.query(`
            SELECT COUNT(*) FROM khatam_achievements_master
            WHERE title != 'Kunci Ka''bah'
        `);

        const totalOwned = await db.query(`
            SELECT COUNT(*) 
            FROM khatam_user_achievements ua
            JOIN khatam_achievements_master m
                ON m.id = ua.achievement_id
            WHERE ua.user_id = $1
            AND ua.is_owned = true
            AND m.title != 'Kunci Ka''bah'
        `, [userId]);

        if (
            parseInt(totalOwned.rows[0].count) >=
            parseInt(totalMaster.rows[0].count)
        ) {
            await unlock(userId, ACHIEVEMENTS.UNIQUE.ALL_BADGES);
        }

    } catch (err) {
        console.error(err);
    }
};

const checkGroupCompletion = async (groupId) => {
    const unfinished = await db.query(`
        SELECT COUNT(*) 
        FROM khatam_group_members gm
        JOIN khatam_plan kp ON kp.id = gm.khatam_plan_id
        WHERE gm.group_id = $1
        AND kp.status != 'completed'
    `, [groupId]);

    if (parseInt(unfinished.rows[0].count) === 0) {

        const members = await db.query(`
            SELECT user_id
            FROM khatam_group_members
            WHERE group_id = $1
        `, [groupId]);

        for (const m of members.rows) {

            await unlock(m.user_id, ACHIEVEMENTS.GROUP.COMPLETE_GROUP);
            await unlock(m.user_id, ACHIEVEMENTS.GROUP.COMPLETE_GROUP_ALT);

            if (await Promise.resolve(isRamadhan())) {
                await unlock(m.user_id, ACHIEVEMENTS.RAMADAN.KHATAM_RAMADAN);
            }

            await checkUnlockAllAchievement(m.user_id);
        }

        await db.query(`
            UPDATE khatam_groups
            SET status='completed'
            WHERE id=$1
        `, [groupId]);
    }
};

const createPlan = async (req, res) => {
    const userId = req.user.id;
    const { target_date, reading_type } = req.body;

    try {
        const activeCheck = await db.query(`
      SELECT id FROM khatam_plan
      WHERE user_id=$1 AND status='active'
    `, [userId]);

        if (activeCheck.rows.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Masih ada plan aktif'
            });
        }
        const totalKhatam = await db.query(`
      SELECT COUNT(*) FROM khatam_plan
      WHERE user_id=$1
    `, [userId]);

        const khatamNumber = parseInt(totalKhatam.rows[0].count) + 1;

        const newPlan = await db.query(`
            INSERT INTO khatam_plan
            (user_id, khatam_number, start_date, target_date, reading_type)
            VALUES ($1, $2, CURRENT_DATE, $3, $4)
            RETURNING id
        `, [userId, khatamNumber, target_date, reading_type]);

        const planId = newPlan.rows[0].id;

        if (khatamNumber === 1) {
            await unlock(userId, ACHIEVEMENTS.UNIQUE.FIRST_PLAN);

            await checkUnlockAllAchievement(userId);

            const groups = await db.query(`
                SELECT group_id
                FROM khatam_group_members
                WHERE khatam_plan_id = $1
            `, [planId]);

            for (const g of groups.rows) {
                await checkGroupCompletion(g.group_id);
            }
        }
        res.json({
            status: 'success',
            message: `Plan khatam ke-${khatamNumber} berhasil dibuat`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const updatePlan = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, target_date } = req.body;

    try {
        const check = await db.query(`
      SELECT * FROM khatam_plan
      WHERE id=$1 AND user_id=$2 AND status='active'
    `, [id, userId]);

        if (!check.rows.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Plan tidak ditemukan'
            });
        }
        const fields = [];
        const values = [];
        let index = 1;

        if (title) {
            fields.push(`title=$${index++}`);
            values.push(title);
        }

        if (target_date) {
            fields.push(`target_date=$${index++}`);
            values.push(target_date);
        }

        if (!fields.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Tidak ada data yang diupdate'
            });
        }

        values.push(id);
        values.push(userId);

        await db.query(`
      UPDATE khatam_plan
      SET ${fields.join(', ')}
      WHERE id=$${index++} AND user_id=$${index}
    `, values);

        res.json({
            status: 'success',
            message: 'Plan berhasil diperbarui'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const getActivePlan = async (req, res) => {
    const userId = req.user.id;

    try {

        const plan = await db.query(`
      SELECT * FROM khatam_plan
      WHERE user_id=$1 AND status='active'
      LIMIT 1
    `, [userId]);

        if (!plan.rows.length) {
            return res.json({ data: null });
        }

        const planData = plan.rows[0];
        const progress = await db.query(`
      SELECT COUNT(DISTINCT juz) as total_juz
      FROM khatam_progress
      WHERE khatam_id=$1
    `, [planData.id]);

        const targetDate = new Date(planData.target_date);
        const now = new Date();

        const remainingDays =
            Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

        const lastJuz = parseInt(progress.rows[0].total_juz) || 0;

        if (lastJuz >= 30) {
            await db.query(`
                UPDATE khatam_plan
                SET status='completed',
                    completed_at=CURRENT_TIMESTAMP
                WHERE id=$1
            `, [planData.id]);

            await unlock(userId, ACHIEVEMENTS.INDIVIDUAL.KHATAM);

            if (remainingDays > 0) {
                await unlock(userId, ACHIEVEMENTS.INDIVIDUAL.KHATAM_FAST);
            }

            await checkUnlockAllAchievement(userId);

            planData.status = 'completed';
        }

        res.json({
            ...planData,
            last_juz_read: lastJuz,
            progress_percent: (lastJuz / 30) * 100,
            remaining_days: remainingDays
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const getHistory = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(`
      SELECT id, khatam_number, start_date, completed_at
      FROM khatam_plan
      WHERE user_id=$1 AND status='completed'
      ORDER BY completed_at DESC
    `, [userId]);

        res.json({
            status: 'success',
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const deletePlan = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        await db.query(`
      DELETE FROM khatam_plan
      WHERE id=$1 AND user_id=$2
    `, [id, userId]);

        res.json({
            status: 'success',
            message: 'Plan dihapus'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const getAllAchievements = async (req, res) => {
    const userId = req.user.id;

    try {

        const result = await db.query(`
            SELECT 
                m.*,
                COALESCE(u.is_owned, false) as is_owned,
                u.owned_at
            FROM khatam_achievements_master m
            LEFT JOIN khatam_user_achievements u
                ON u.achievement_id = m.id
                AND u.user_id = $1
            ORDER BY m.id ASC
        `, [userId]);

        res.json({
            status: 'success',
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const getMyAchievements = async (req, res) => {
    const userId = req.user.id;

    try {

        const result = await db.query(`
            SELECT 
                m.*,
                u.is_owned,
                u.owned_at
            FROM khatam_user_achievements u
            JOIN khatam_achievements_master m
                ON m.id = u.achievement_id
            WHERE u.user_id = $1
            AND u.is_owned = true
            ORDER BY u.owned_at DESC
        `, [userId]);

        res.json({
            status: 'success',
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const claimAchievement = async (req, res) => {
    const userId = req.user.id;
    const { achievement_id } = req.body;

    try {

        await db.query(`
            INSERT INTO khatam_user_achievements
            (user_id, achievement_id, is_owned, owned_at)
            VALUES ($1, $2, true, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, achievement_id)
            DO NOTHING
        `, [userId, achievement_id]);

        res.json({
            status: 'success',
            message: 'Achievement berhasil didapatkan'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

module.exports = {
    createPlan,
    updatePlan,
    getActivePlan,
    getHistory,
    deletePlan,
    getAllAchievements,
    getMyAchievements,
    claimAchievement
};
