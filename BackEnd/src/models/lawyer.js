module.exports = (sequelize, Sequelize) => {


    const Lawyer = sequelize.define('lawyer', {
        UuidLawyer: {
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
        PublicKey: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        }
      
    });

    Lawyer.associate = (models) => {
        Lawyer.hasMany(models.report, {
            foreignKey: 'UuidLawyer', // Colonna di collegamento
            as: 'reports',           // Alias per l'associazione
        });
    };

    return Lawyer;
};