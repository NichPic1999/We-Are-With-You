module.exports = (sequelize, Sequelize) => {
    const Client = sequelize.define('client', {
        UuidClient: {
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
        TelephoneNumber: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        Username: {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true
        },HashEmail: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        }
    
    });
    return Client;
};

