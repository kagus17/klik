
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config(); // wczytuje plik .env
const dbConfig = require('./dbConfig');
const pool = mysql.createPool(dbConfig);

module.exports = pool.promise();

