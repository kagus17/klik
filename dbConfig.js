const fs = require('fs');
const path = require('path');

module.exports = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, 'certs', 'DigiCertGlobalRootCA.crt.pem'))
  }
};
