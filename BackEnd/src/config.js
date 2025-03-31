require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    DB_NAME: process.env.DB_NAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_ACCESS:process.env.DB_ACCESS,
    pubKey: null
}