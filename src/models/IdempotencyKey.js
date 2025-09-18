'use strict';
module.exports = (sequelize, DataTypes) => {
    const IdempotencyKey = sequelize.define('IdempotencyKey', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: DataTypes.INTEGER,
        key: DataTypes.STRING,
        route: DataTypes.STRING
    }, {
        tableName: 'idempotency_keys',
        underscored: true
    });
    return IdempotencyKey;
};
