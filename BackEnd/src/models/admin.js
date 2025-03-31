const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {


    const Admin = sequelize.define('admin', {
        UuidAdmin: {
            type: Sequelize.CHAR(36),
            primaryKey: true,
            allowNull: false
        },
        Email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        Password: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        CreationData:{
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    });

    Admin.associate = (models) => {
        Admin.hasMany(models.invitation, {
            foreignKey: 'UuidAdmin',
            sourceKey: 'UuidAdmin',
            as: 'invitations',
        });
    };

    return Admin;
};