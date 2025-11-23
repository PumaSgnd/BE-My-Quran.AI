// src/models/JournalEntry.js
'use strict';

module.exports = (sequelize, DataTypes) => {
    const JournalEntry = sequelize.define('JournalEntry', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        entry_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        reflection_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        checkin_data: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
    }, {
        tableName: 'journal_entries',
        underscored: true,
        timestamps: true, // created_at & updated_at otomatis
    });

    return JournalEntry;
};
