module.exports = (sequelize, DataTypes) => {
    const AyahViews = sequelize.define("AyahViews", {
        ayah_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
        },
        total_views: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    }, {
        tableName: "ayah_views",
        timestamps: false
    });

    return AyahViews;
};
