const config = require('../config');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(config.DB_NAME, config.DB_ACCESS, config.DB_PASSWORD ||'', {
    host: config.DB_HOST,
    dialect: 'mysql',
    logging: true,
    define: {
        timestamps: false
    }
});

const db = {};
db.sequelize = sequelize;
db.client = require("./client")(sequelize, Sequelize);
db.report = require("./report")(sequelize, Sequelize);
db.admin = require("./admin")(sequelize, Sequelize);
db.lawyer = require("./lawyer")(sequelize, Sequelize);
db.invitation = require("./invitation")(sequelize, Sequelize);

// Definizione delle relazioni
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});


db.syncDatabase = async (force = false) => {
    try {
        await sequelize.authenticate();
        console.log('Connessione al database riuscita!');
        await sequelize.sync({ force });
        console.log('Sincronizzazione del database completata.');
    } catch (error) {
        console.error('Errore durante la connessione al database:', error);
        process.exit(1);
    }

};

module.exports = db;

