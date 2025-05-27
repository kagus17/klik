const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST, // np. 'nazwa-serwera.mysql.database.azure.com'
  user: process.env.DB_USER, // np. 'nazwa-uzytkownika@nazwa-serwera'
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: {
    rejectUnauthorized: true, // Wymagaj weryfikacji certyfikatu
    // Używamy certyfikatu CA dostarczonego przez Azure
    ca: fs.readFileSync(path.join(__dirname, 'certs', 'DigiCertGlobalRootCA.crt.pem'))
  }
};