/*const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gra1v1'
});

module.exports = pool.promise();*/

const mysql = require('mysql2');
require('dotenv').config(); // wczytuje plik .env

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: {
    ca: process.env.DB_SSL_CA,  // pobieramy certyfikat SSL z zmiennej środowiskowej
  }
});

module.exports = pool.promise();

