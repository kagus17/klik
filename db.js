/*const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gra1v1'
});

module.exports = pool.promise();*/
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'klik2-db.mysql.database.azure.com',
  user: 'klikUser@klik2-db.mysql.database.azure.com', // Uwaga: musi zawierać @nazwa_serwera!
  password: 'Pass123!',
  database: 'klikgra', // lub jak nazwałeś swoją bazę
  port: 3306,
  ssl: {
    rejectUnauthorized: true
  }
});

module.exports = pool.promise();

