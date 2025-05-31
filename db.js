/**
 * @file db.js
 * @description Moduł konfigurujący pulę połączeń z bazą danych MySQL dla aplikacji multiplayerowej. Używa konfiguracji z pliku dbConfig.js i udostępnia pulę w trybie promisów dla obsługi asynchronicznej.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-28
 */

/**
 * @module Database
 * @requires mysql2
 * @requires ./dbConfig
 */

/**
 * Moduł mysql2 do obsługi połączeń z bazą danych MySQL.
 * @constant {Object} mysql
 */
const mysql = require('mysql2');

/**
 * Konfiguracja połączenia z bazą danych z pliku dbConfig.js.
 * @constant {Object} dbConfig
 */
const dbConfig = require('./dbConfig');

/**
 * Pula połączeń z bazą danych MySQL.
 * @constant {Object} pool
 * @description Tworzy pulę połączeń na podstawie konfiguracji z dbConfig.js. Umożliwia wielokrotne użycie połączeń w celu optymalizacji wydajności.
 */
const pool = mysql.createPool(dbConfig);

/**
 * Eksportuje pulę połączeń w trybie promisów.
 * @description Umożliwia asynchroniczną obsługę zapytań do bazy danych za pomocą składni async/await.
 * @returns {Object} Pula połączeń z obsługą promisów.
 */
module.exports = pool.promise(); // Używamy promisów dla lepszej obsługi asynchronicznej

/**
 * @ignore
 * @description Zakomentowana alternatywna konfiguracja puli połączeń z użyciem zmiennych środowiskowych z pliku .env.
 * @example
 * const fs = require('fs');
 * const path = require('path');
 * const mysql = require('mysql2');
 * require('dotenv').config();
 *
 * const pool = mysql.createPool({
 *   host: process.env.DB_HOST,
 *   user: process.env.DB_USER,
 *   password: process.env.DB_PASSWORD,
 *   database: process.env.DB_NAME,
 *   port: 3306,
 *   ssl: {
 *     ca: fs.readFileSync(path.join(__dirname, 'certs', 'DigiCertGlobalRootCA.crt.pem'))
 *   }
 * });
 */
