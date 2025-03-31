const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {


    const Invitation = sequelize.define('invitation', {
        UuidInvitations: {
            type: Sequelize.CHAR(36),
            primaryKey: true,
            allowNull: false
        },
        HashEmail: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        Token: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        Is_used: {
            type: DataTypes.BOOLEAN, 
            allowNull: false,
            defaultValue: false, 
        }, 
        Created_at: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW, 
            allowNull: false
        },
        UuidAdmin: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
    });

    Invitation.associate = (models) => {
        Invitation.belongsTo(models.admin, {
            foreignKey: 'UuidAdmin',
            targetKey: 'UuidAdmin',
            as: 'admin',
        });
    };
    
    return Invitation;
};