require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/database');

class DBConnection {
    constructor() {
        this.pool = mysql.createPool({
            ...config,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }

    async getConnection() {
        try {
            return await this.pool.getConnection();
        } catch (error) {
            console.error('Error getting connection from pool:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();

        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * データベース接続が生きているかを確認する
     * @returns {Promise<boolean>} 接続が生きていればtrue、そうでなければfalse
     */
    async ping() {
        try {
            await this.query('SELECT 1');
            return true;
        } catch (error) {
            console.error('Database ping failed:', error);
            return false;
        }
    }
}

// シングルトンインスタンスとしてエクスポート
module.exports = new DBConnection();
