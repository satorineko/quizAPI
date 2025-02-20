const DBConnection = require('./DBConnection');

class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = DBConnection;
    }

    async executeQuery(query, params = []) {
        let connection;
        try {
            connection = await this.db.getConnection();
            const [result] = await connection.query(query, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async findAll() {
        return await this.executeQuery(`SELECT * FROM ${this.tableName}`);
    }

    async findById(id) {
        const result = await this.executeQuery(
            `SELECT * FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return result[0];
    }

    async create(data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data)
            .map(() => '?')
            .join(', ');
        const values = Object.values(data);

        const result = await this.executeQuery(
            `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
            values
        );
        return result;
    }

    async update(id, data) {
        const setClause = Object.keys(data)
            .map((key) => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(data), id];

        const result = await this.executeQuery(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
            values
        );
        return result;
    }

    async delete(id) {
        const result = await this.executeQuery(
            `DELETE FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return result;
    }

    // ページネーション用のメソッド
    async findAllPaginated(page = 1, limit = 10) {
        const numLimit = parseInt(limit, 10);
        const numPage = parseInt(page, 10);
        const offset = (numPage - 1) * numLimit;

        const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const dataQuery = `
            SELECT * FROM ${this.tableName}
            LIMIT ${numLimit} OFFSET ${offset}
        `;

        try {
            const [[count], data] = await Promise.all([
                this.executeQuery(countQuery),
                this.executeQuery(dataQuery),
            ]);

            return {
                data,
                pagination: {
                    total: count.total,
                    page: numPage,
                    limit: numLimit,
                    totalPages: Math.ceil(count.total / numLimit),
                },
            };
        } catch (error) {
            console.error('Pagination error:', error);
            throw error;
        }
    }
}

module.exports = BaseRepository;
