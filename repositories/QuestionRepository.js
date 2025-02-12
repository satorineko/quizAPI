const BaseRepository = require('../database/BaseRepository');

class QuestionRepository extends BaseRepository {
    constructor() {
        super('questions');
    }

    async findWithAllRelations(id) {
        const query = `
            SELECT 
                q.*,
                c.id as choice_id,
                c.choice_text,
                c.is_correct,
                a.answer_text,
                e.explanation_text,
                u.name as author_name
            FROM questions q
            LEFT JOIN choices c ON q.id = c.question_id
            LEFT JOIN answers a ON q.id = a.question_id
            LEFT JOIN explanations e ON q.id = e.question_id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ?
        `;
        return await this.db.query(query, [id]);
    }

    async findByType(type) {
        return await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE type = ?`,
            [type]
        );
    }

    async findByUserId(userId) {
        return await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE user_id = ?`,
            [userId]
        );
    }

    // タイプ別の問題数を集計
    async countByType() {
        const query = `
            SELECT type, COUNT(*) as count
            FROM ${this.tableName}
            GROUP BY type
        `;
        return await this.db.query(query);
    }

    // ユーザー別の問題作成数を集計
    async countByUser() {
        const query = `
            SELECT 
                u.id,
                u.name,
                COUNT(q.id) as question_count
            FROM users u
            LEFT JOIN ${this.tableName} q ON u.id = q.user_id
            GROUP BY u.id, u.name
        `;
        return await this.db.query(query);
    }

    // 期間別の問題作成数を集計
    async countByPeriod(period = 'month') {
        let dateFormat;
        switch (period) {
            case 'day':
                dateFormat = '%Y-%m-%d';
                break;
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m';
        }

        const query = `
            SELECT 
                DATE_FORMAT(create_at, ?) as period,
                COUNT(*) as count
            FROM ${this.tableName}
            GROUP BY period
            ORDER BY period DESC
        `;
        return await this.db.query(query, [dateFormat]);
    }

    // タイプ別のページネーション付き検索
    async findByTypePaginated(type, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM ${this.tableName}
            WHERE type = ?
        `;
        const dataQuery = `
            SELECT * FROM ${this.tableName}
            WHERE type = ?
            LIMIT ? OFFSET ?
        `;

        const [[count], data] = await Promise.all([
            this.db.query(countQuery, [type]),
            this.db.query(dataQuery, [type, limit, offset]),
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

module.exports = new QuestionRepository();
