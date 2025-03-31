module.exports = (sequelize, Sequelize) => {


    const Report = sequelize.define('report', {
        UuidReport: {
            type: Sequelize.CHAR(36),
            primaryKey: true,
            allowNull: false
        },
        PiValue: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        CipherC: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        CipherUser: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        ERecord: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        UuidLawyer: {
            type: Sequelize.CHAR(36),
            allowNull: false, 
        }
    });

    Report.associate = (models) => {
        Report.belongsTo(models.lawyer, {
            foreignKey: 'UuidLawyer', // Colonna di collegamento
            as: 'lawyer',            // Alias per l'associazione
            onDelete: 'CASCADE',     // Comportamento alla cancellazione
        });
    };

    return Report;
};