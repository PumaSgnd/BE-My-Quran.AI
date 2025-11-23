// src/models/JournalMonthlyTarget.js
'use strict';

module.exports = (sequelize, DataTypes) => {
    const JournalMonthlyTarget = sequelize.define('JournalMonthlyTarget', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        target_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        tableName: 'journal_monthly_targets',
        underscored: true,
        timestamps: true, // created_at & updated_at otomatis
    });

    return JournalMonthlyTarget;
};
