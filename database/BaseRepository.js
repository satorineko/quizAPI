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
                this.db.query(countQuery),
                this.db.query(dataQuery),
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

    // ページネーション付き問題一覧取得
    async findAllWithDetailsPaginated(page, limit) {
        const offset = (page - 1) * limit;
        const sql = `
            SELECT 
                q.id,
                q.text,
                q.type,
                q.create_at,
                q.update_at,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', c.id,
                        'text', c.text,
                        'is_correct', c.is_correct
                    )
                ) as choices,
                e.explanation_text as explanation
            FROM questions q
            LEFT JOIN choices c ON q.id = c.question_id
            LEFT JOIN explanations e ON q.id = e.question_id
            GROUP BY q.id, q.text, q.type, q.create_at, q.update_at, e.explanation_text
            LIMIT ? OFFSET ?
        `;

        // limitとoffsetの値が数値であることを確認
        const params = [Number(limit), Number(offset)];
        return await this.db.query(sql, params);
    }
}

module.exports = BaseRepository;
