import mysql from 'mysql2';
import util from 'util';
import { config } from '../config.js';  // Cách import đúng khi dùng export

import logHelper from '../common/log.js';

// Cấu hình kết nối MySQL
const configDB = {
    user: config.user,
    host: config.host,
    port: 3306,
    password: config.password,
    database: 'real_estate_project' 
};

// Tạo một connection pool để có thể thực hiện nhiều truy vấn đồng thời
const pool = mysql.createPool(configDB);

// Sử dụng promisify để sử dụng async/await với mysql query
const query = util.promisify(pool.query).bind(pool);

class Database {

    /**
    * Thực thi truy vấn SQL với tham số (cách khác, sử dụng biến `query`)
    */
    async executeQueryAsyncDB(queryString, parameters = []) {
        try {
            const result = await query(queryString, parameters);
            return result;
        } catch (error) {
            logHelper.writeLog("executeQueryAsync" + "/\n" + queryString, error);
            return null;
        }
    }

    /**
     * Truy vấn SQL đơn giản không có tham số
     * @param {string} queryString
     * @returns {Promise<any>}
     */
    async executeQuery(queryString) {
        try {
            const result = await query(queryString);
            return result;
        } catch (error) {
            logHelper.writeLog(`executeQuery: ${queryString}`, error);
            return null;
        }
    }

    /**
     * Truy vấn SQL có tham số
     * @param {string} queryString
     * @param {Array} parameters
     * @returns {Promise<object>}
     */
    async executeQueryWithParams(queryString, parameters = []) {
        try {
            const [rows] = await pool.promise().query(queryString, parameters);
            return { rs: true, data: rows };
        } catch (error) {
            logHelper.writeLog(`executeQueryWithParams: ${queryString}`, error);
            return { rs: false, msg: error.message };
        }
    }

    /**
     * Thực thi truy vấn SQL không cần trả về dữ liệu, chỉ biết số dòng bị ảnh hưởng (INSERT, UPDATE, DELETE)
     * @param {string} queryString
     * @returns {Promise<number>}
     */
    async executeNonQuery(queryString) {
        try {
            const result = await query(queryString);
            return result.affectedRows;
        } catch (error) {
            logHelper.writeLog(`executeNonQuery: ${queryString}`, error);
            return 0;
        }
    }

    /**
     * Chèn dữ liệu và trả về ID của bản ghi mới
     * @param {string} queryString
     * @returns {Promise<number>}
     */
    async executeInsertReturnId(queryString) {
        try {
            const result = await query(queryString);
            return result.insertId;
        } catch (error) {
            logHelper.writeLog(`executeInsertReturnId: ${queryString}`, error);
            return 0;
        }
    }

    /**
     * Thực thi stored procedure (SP) không có tham số
     * @param {string} queryString
     * @returns {Promise<any>}
     */
    async executeSP(queryString) {
        try {
            const result = await query(queryString);
            return result;
        } catch (error) {
            logHelper.writeLog(`executeSP: ${queryString}`, error);
            return null;
        }
    }

    /**
     * Thực thi truy vấn với callback
     * @param {string} queryString
     * @param {function} callback
     */
    executeQueryWithCallback(queryString, callback) {
        pool.query(queryString, (err, result, fields) => {
            if (err) {
                callback({ rs: false, msg: err });
            } else {
                callback({ rs: true, msg: '', data: result });
            }
        });
    }

    /**
     * Thực thi stored procedure (SP) với callback
     * @param {string} queryString
     * @param {function} callback
     */
    executeSPWithCallback(queryString, callback) {
        pool.query(queryString, (err, result, fields) => {
            if (err) {
                callback({ rs: false, msg: err });
            } else {
                callback({ rs: true, msg: '', data: result[0] });
            }
        });
    }
}

export default Database;
