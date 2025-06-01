/**
 * @file dbConfig.js
 * @description Moduł konfiguracyjny dla połączenia z bazą danych MySQL. Wczytuje zmienne środowiskowe z pliku .env i konfiguruje połączenie z użyciem certyfikatu SSL dla Azure.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-28
 */

/**
 * @module DatabaseConfig
 * @requires fs
 * @requires path
 * @requires dotenv
 */

/**
 * Moduł do operacji na systemie plików.
 * @constant {Object} fs
 */
const fs = require('fs');

/**
 * Moduł do obsługi ścieżek plików.
 * @constant {Object} path
 */
const path = require('path');

/**
 * Moduł do wczytywania zmiennych środowiskowych z pliki .env.
 * @constant {Object} dotenv
 */
require('dotenv').config();

/**
 * Konfiguracja połączenia z bazą danych MySQL.
 * @typedef {Object} DatabaseConfig
 * @property {string} host - Adres hosta bazy danych (np. 'nazwa-serwera.mysql.database.azure.com').
 * @property {string} user - Nazwa użytkownika bazy danych (np. 'nazwa-uzytkownika@nazwa-serwera').
 * @property {string} password - Hasło do bazy danych.
 * @property {string} database - Nazwa bazy danych.
 * @property {number} port - Port połączenia (domyślnie 3306 dla MySQL).
 * @property {Object} ssl - Konfiguracja SSL dla bezpiecznego połączenia.
 * @property {boolean} ssl.rejectUnauthorized - Wymaga weryfikacji certyfikatu SSL.
 * @property {Buffer} ssl.ca - Certyfikat CA wczytany z pliku DigiCertGlobalRootCA.crt.pem.
 */

/**
 * Eksportuje obiekt konfiguracyjny dla połączenia z bazą danych MySQL.
 * @type {DatabaseConfig}
 */
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