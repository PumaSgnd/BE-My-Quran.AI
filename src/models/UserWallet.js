'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserWallet = sequelize.define('UserWallet', {
        user_id: { type: DataTypes.INTEGER, primaryKey: true },
        stars: DataTypes.INTEGER
    }, {
        tableName: 'user_wallet',
        underscored: true
    });
    return UserWallet;
};
