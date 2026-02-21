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

const distributeJuz = async (groupId, client = db) => {
    const members = await client.query(`
    SELECT id, user_id, role
    FROM khatam_group_members
    WHERE group_id=$1
    ORDER BY 
      CASE WHEN role='creator' THEN 2 ELSE 1 END,
      joined_at
  `, [groupId]);

    const totalMembers = members.rows.length;
    if (!totalMembers) return;

    if (totalMembers > 30) {
        console.error('Group member overflow:', groupId);
        return;
    }

    const juzPerUser = Math.floor(30 / totalMembers);
    let remainder = 30 % totalMembers;

    let start = 1;

    for (const m of members.rows) {
        let end = start + juzPerUser - 1;

        if (remainder > 0) {
            end++;
            remainder--;
        }

        await client.query(`
      UPDATE khatam_group_members
      SET juz_start=$1, juz_end=$2
      WHERE id=$3
    `, [start, end, m.id]);

        start = end + 1;
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

    if (parseInt(unfinished.rows[0].count) !== 0) return;

    const group = await db.query(`
        SELECT target_date 
        FROM khatam_groups
        WHERE id=$1
    `, [groupId]);

    const targetDate = new Date(group.rows[0].target_date);
    const today = new Date();

    const remainingDays = Math.ceil(
        (targetDate - today) / (1000 * 60 * 60 * 24)
    );

    const members = await db.query(`
        SELECT user_id
        FROM khatam_group_members
        WHERE group_id = $1
    `, [groupId]);

    for (const m of members.rows) {

        await unlock(m.user_id, ACHIEVEMENTS.GROUP.COMPLETE_GROUP);
        await unlock(m.user_id, ACHIEVEMENTS.GROUP.COMPLETE_GROUP_ALT);

        if (remainingDays > 0) {
            await unlock(
                m.user_id,
                ACHIEVEMENTS.GROUP.COMPLETE_GROUP_FAST
            );
        }

        if (isRamadhan()) {
            await unlock(
                m.user_id,
                ACHIEVEMENTS.RAMADAN.KHATAM_RAMADAN
            );
        }

        await checkUnlockAllAchievement(m.user_id);
    }

    await db.query(`
    UPDATE khatam_groups
    SET status='completed'
    WHERE id=$1
  `, [groupId]);
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

        const nextNumber = await db.query(`
      SELECT COALESCE(MAX(khatam_number),0) + 1 as next
      FROM khatam_plan
      WHERE user_id=$1
    `, [userId]);

        const khatamNumber = nextNumber.rows[0].next;

        const newPlan = await db.query(`
      INSERT INTO khatam_plan
      (user_id, khatam_number, start_date, target_date, reading_type)
      VALUES ($1,$2,CURRENT_DATE,$3,$4)
      RETURNING id
    `, [userId, khatamNumber, target_date, reading_type]);

        if (khatamNumber === 1) {
            await unlock(userId, ACHIEVEMENTS.UNIQUE.FIRST_PLAN);
            await checkUnlockAllAchievement(userId);
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

        const groupCheck = await db.query(`
        SELECT 
            g.id as group_id,
            g.group_name,
            g.target_date as group_target_date,
            g.invite_token,
            g.invite_code,
            g.status as group_status,
            gm.juz_start,
            gm.juz_end
        FROM khatam_group_members gm
        JOIN khatam_groups g ON g.id = gm.group_id
        WHERE gm.khatam_plan_id=$1
        AND g.status='active'
        LIMIT 1
        `, [planData.id]);

        if (groupCheck.rows.length) {

            const groupData = groupCheck.rows[0];

            const totalMembers = await db.query(`
                SELECT COUNT(*) FROM khatam_group_members
                WHERE group_id=$1
            `, [groupData.group_id]);

            const assignedTotal =
                groupData.juz_end - groupData.juz_start + 1;

            return res.json({
                mode: 'group',
                group_id: groupData.group_id,
                group_name: groupData.group_name,
                invite_token: groupData.invite_token,
                invite_code: groupData.invite_code,
                members_count: parseInt(totalMembers.rows[0].count),
                juz_assigned: assignedTotal,
                juz_remaining: Math.max(assignedTotal - lastJuz, 0),
                progress_percent: (lastJuz / assignedTotal) * 100,
                remaining_days: remainingDays
            });
        }

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

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const groups = await client.query(`
      SELECT group_id
      FROM khatam_group_members
      WHERE khatam_plan_id=$1
    `, [id]);

        await client.query(`
      DELETE FROM khatam_group_members
      WHERE khatam_plan_id=$1
    `, [id]);

        const del = await client.query(`
      DELETE FROM khatam_plan
      WHERE id=$1 AND user_id=$2
      RETURNING id
    `, [id, userId]);

        if (!del.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ status: 'error' });
        }

        for (const g of groups.rows) {

            const memberCheck = await client.query(`
        SELECT COUNT(*) FROM khatam_group_members
        WHERE group_id=$1
      `, [g.group_id]);

            if (parseInt(memberCheck.rows[0].count) === 0) {
                await client.query(`
          UPDATE khatam_groups
          SET status='completed'
          WHERE id=$1
        `, [g.group_id]);
            } else {
                await distributeJuz(g.group_id, client);
            }
        }

        await client.query('COMMIT');

        res.json({ status: 'success' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ status: 'error' });
    } finally {
        client.release();
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

const createGroup = async (req, res) => {
    const userId = req.user.id;
    const { group_name, target_date, khatam_plan_id } = req.body;
    const { nanoid } = require('nanoid');
    const inviteToken = nanoid(6);
    const inviteCode = Math.floor(1000 + Math.random() * 9000);
    const inviteExpiresAt = new Date(target_date);

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const planCheck = await client.query(`
      SELECT id FROM khatam_plan
      WHERE id=$1 AND user_id=$2 AND status='active'
    `, [khatam_plan_id, userId]);

        if (!planCheck.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                status: 'error',
                message: 'Plan khatam tidak valid'
            });
        }

        const group = await client.query(`
            INSERT INTO khatam_groups 
            (group_name, created_by, target_date, invite_token, invite_code, invite_expires_at)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING id
        `, [group_name, userId, target_date, inviteToken, inviteCode, inviteExpiresAt]);

        const groupId = group.rows[0].id;

        await client.query(`
      INSERT INTO khatam_group_members
      (group_id,user_id,khatam_plan_id,role)
      VALUES ($1,$2,$3,'creator')
    `, [groupId, userId, khatam_plan_id]);

        await distributeJuz(groupId, client);

        await unlock(userId, ACHIEVEMENTS.GROUP.CREATE_GROUP);

        const total = await client.query(`
        SELECT COUNT(*) FROM khatam_group_members
        WHERE group_id=$1
        `, [groupId]);

        if (isRamadhan() && parseInt(total.rows[0].count) >= 3) {
            await unlock(userId, ACHIEVEMENTS.RAMADAN.CREATE_3_GROUP);
        }

        await client.query('COMMIT');

        res.json({
            status: 'success',
            group_id: groupId,
            invite_token: inviteToken,
            invite_code: inviteCode
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ status: 'error' });
    } finally {
        client.release();
    }
};

const joinGroup = async (req, res) => {
    const userId = req.user.id;
    const { group_id, khatam_plan_id } = req.body;

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const groupCheck = await client.query(`
            SELECT status, invite_expires_at 
            FROM khatam_groups 
            WHERE id=$1
        `, [group_id]);

        if (!groupCheck.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ status: 'error', message: 'Group tidak ditemukan' });
        }

        if (groupCheck.rows[0].invite_expires_at && new Date() > groupCheck.rows[0].invite_expires_at) {
            await client.query('ROLLBACK');
            return res.status(400).json({ status: 'error', message: 'Invite expired' });
        }

        if (groupCheck.rows[0].status !== 'active') {
            await client.query('ROLLBACK');
            return res.status(400).json({ status: 'error', message: 'Group tidak aktif' });
        }

        const existingMember = await client.query(`
            SELECT id FROM khatam_group_members
            WHERE group_id=$1 AND user_id=$2
        `, [group_id, userId]);

        if (existingMember.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ status: 'error', message: 'Sudah join grup ini' });
        }

        let finalPlanId;

        if (khatam_plan_id) {
            const planCheck = await client.query(`
                SELECT id FROM khatam_plan
                WHERE id=$1 AND user_id=$2 AND status='active'
            `, [khatam_plan_id, userId]);

            if (!planCheck.rows.length) {
                await client.query('ROLLBACK');
                return res.status(400).json({ status: 'error', message: 'Plan khatam tidak valid' });
            }
            finalPlanId = khatam_plan_id;
        } else {
            const creatorPlan = await client.query(`
                SELECT kp.target_date, kp.reading_type
                FROM khatam_group_members gm
                JOIN khatam_plan kp ON kp.id = gm.khatam_plan_id
                WHERE gm.group_id = $1 AND gm.role='creator'
                LIMIT 1
            `, [group_id]);

            if (!creatorPlan.rows.length) {
                await client.query('ROLLBACK');
                return res.status(400).json({ status: 'error', message: 'Tidak bisa mendapatkan plan creator' });
            }

            const cp = creatorPlan.rows[0];

            const nextNumber = await client.query(`
                SELECT COALESCE(MAX(khatam_number),0) + 1 as next
                FROM khatam_plan
                WHERE user_id=$1
            `, [userId]);

            const newPlan = await client.query(`
                INSERT INTO khatam_plan
                (user_id, khatam_number, start_date, target_date, reading_type)
                VALUES ($1,$2,CURRENT_DATE,$3,$4)
                RETURNING id
            `, [userId, nextNumber.rows[0].next, cp.target_date, cp.reading_type]);

            finalPlanId = newPlan.rows[0].id;
        }

        const total = await client.query(`
            SELECT COUNT(*) FROM khatam_group_members
            WHERE group_id=$1
        `, [group_id]);

        if (parseInt(total.rows[0].count) >= 30) {
            await client.query('ROLLBACK');
            return res.status(400).json({ status: 'error', message: 'Grup sudah penuh' });
        }

        try {
            const insert = await client.query(`
                INSERT INTO khatam_group_members
                (group_id,user_id,khatam_plan_id)
                SELECT $1,$2,$3
                WHERE (
                    SELECT COUNT(*) 
                    FROM khatam_group_members
                    WHERE group_id=$1
                ) < 30
                RETURNING id
            `, [group_id, userId, finalPlanId]);

            if (!insert.rows.length) {
                await client.query('ROLLBACK');
                return res.status(400).json({ status: 'error', message: 'Grup sudah penuh' });
            }
        } catch (err) {
            if (err.code === '23505') {
                await client.query('ROLLBACK');
                return res.status(400).json({ status: 'error', message: 'Plan sudah tergabung di grup lain' });
            }
            throw err;
        }

        await distributeJuz(group_id, client);
        await unlock(userId, ACHIEVEMENTS.UNIQUE.FIRST_JOIN_QURAN);

        const newTotal = await client.query(`
            SELECT COUNT(*) FROM khatam_group_members
            WHERE group_id=$1
        `, [group_id]);

        if (isRamadhan() && parseInt(newTotal.rows[0].count) >= 3) {
            await unlock(userId, ACHIEVEMENTS.RAMADAN.JOIN_3_GROUP);
        }

        await client.query('COMMIT');

        res.json({ status: 'success', message: 'Berhasil join grup' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ status: 'error' });
    } finally {
        client.release();
    }
};

const getGroupByInvite = async (req, res) => {
    const { token } = req.params;

    const group = await db.query(`
    SELECT id, group_name, invite_code,
           invite_expires_at
    FROM khatam_groups
    WHERE invite_token=$1
    AND status='active'
  `, [token]);

    if (!group.rows.length) {
        return res.status(404).json({ status: 'error' });
    }

    if (
        group.rows[0].invite_expires_at &&
        new Date() > group.rows[0].invite_expires_at
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Invite expired'
        });
    }

    res.json(group.rows[0]);
};

module.exports = {
    createPlan,
    updatePlan,
    getActivePlan,
    getHistory,
    deletePlan,
    getAllAchievements,
    getMyAchievements,
    createGroup,
    joinGroup,
    getGroupByInvite
};
