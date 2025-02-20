const BaseRepository = require('../database/BaseRepository');

class QuestionRepository extends BaseRepository {
    constructor() {
        super('questions');
    }

    // 基本的な問題データの取得
    async findQuestionWithDetails(id) {
        const query = `
            SELECT 
                q.id,
                q.text,
                q.type,
                q.create_at,
                q.update_at,
                u.name as author_name
            FROM questions q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ?
        `;
        const [rows] = await this.executeQuery(query, [id]);
        return rows[0];
    }

    // ページネーション付きの基本問題リスト取得
    async findAllPaginated(page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const dataQuery = `
            SELECT 
                q.id,
                q.text,
                q.type,
                q.create_at,
                q.update_at,
                u.name as author_name
            FROM ${this.tableName} q
            LEFT JOIN users u ON q.user_id = u.id
            ORDER BY q.create_at DESC
            LIMIT ? OFFSET ?
        `;

        const [[countResult], questions] = await Promise.all([
            this.executeQuery(countQuery),
            this.executeQuery(dataQuery, [Number(limit), Number(offset)]),
        ]);
        const total = countResult.total;
        return {
            data: questions,
            pagination: {
                total: total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

module.exports = new QuestionRepository();
