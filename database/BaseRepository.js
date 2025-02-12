class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = require('./DBConnection');
    }

    async findAll() {
        return await this.db.query(`SELECT * FROM ${this.tableName}`);
    }

    async findById(id) {
        return await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
    }

    async create(data) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map(() => '?').join(', ');

        const result = await this.db.query(
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

        const result = await this.db.query(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
            values
        );
        return result;
    }

    async delete(id) {
        return await this.db.query(
            `DELETE FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
    }

    // ページネーション用のメソッド
    async findAllPaginated(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const dataQuery = `
            SELECT * FROM ${this.tableName}
            LIMIT ? OFFSET ?
        `;

        const [[count], data] = await Promise.all([
            this.db.query(countQuery),
            this.db.query(dataQuery, [limit, offset]),
        ]);

        return {
            data,
            pagination: {
                total: count.total,
                page,
                limit,
                totalPages: Math.ceil(count.total / limit),
            },
        };
    }
}

module.exports = BaseRepository;
