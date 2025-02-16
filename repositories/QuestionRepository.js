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
                c.text as choice_text,
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

    async findAllWithDetails() {
        const query = `
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
        `;
        return await this.db.query(query);
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
        const numLimit = parseInt(limit, 10);
        const numPage = parseInt(page, 10);
        const offset = (numPage - 1) * numLimit;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM ${this.tableName}
            WHERE type = ?
        `;
        const dataQuery = `
            SELECT * FROM ${this.tableName}
            WHERE type = ?
            LIMIT ${numLimit} OFFSET ${offset}
        `;

        try {
            const [[count], data] = await Promise.all([
                this.db.query(countQuery, [type]),
                this.db.query(dataQuery, [type]),
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
            console.error('Type pagination error:', error);
            throw error;
        }
    }

    async findAllWithDetailsPaginated(page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        // 総件数を取得するクエリ
        const countQuery = `
            SELECT COUNT(DISTINCT q.id) as total 
            FROM questions q
        `;

        // メインデータを取得するクエリ
        const dataQuery = `
            SELECT 
                q.id,
                q.text,
                q.type,
                q.create_at as created_at,
                q.update_at as updated_at,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', c.id,
                        'text', c.text,
                        'is_correct', c.is_correct
                    )
                ) as choices,
                e.explanation_text
            FROM questions q
            LEFT JOIN choices c ON q.id = c.question_id
            LEFT JOIN explanations e ON q.id = e.question_id
            GROUP BY 
                q.id, 
                q.text, 
                q.type, 
                q.create_at, 
                q.update_at, 
                e.explanation_text
            ORDER BY q.create_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        try {
            const [[count], data] = await Promise.all([
                this.db.query(countQuery),
                this.db.query(dataQuery),
            ]);

            // NULLの選択肢を除外し、適切な形式に整形
            const formattedData = data.map((item) => ({
                id: item.id,
                text: item.text,
                type: item.type,
                choices: item.choices.filter((choice) => choice.id != null),
                explanation_text: item.explanation_text,
                created_at: item.created_at,
                updated_at: item.updated_at,
            }));

            return {
                data: formattedData,
                pagination: {
                    total: count.total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(count.total / limit),
                },
            };
        } catch (error) {
            console.error('Error in findAllWithDetailsPaginated:', error);
            throw error;
        }
    }

    async getQuestionWithChoices(id) {
        const dataQuery = `
            SELECT 
                q.id,
                q.text,
                q.type,
                q.create_at as created_at,
                q.update_at as updated_at,
                COALESCE(
                    JSON_ARRAYAGG(
                        IF(c.id IS NOT NULL,
                            JSON_OBJECT(
                                'id', c.id,
                                'text', c.text,
                                'is_correct', c.is_correct
                            ),
                            NULL
                        )
                    ),
                    JSON_ARRAY()
                ) as choices,
                e.explanation_text,
                u.name as author_name
            FROM questions q
            LEFT JOIN choices c ON q.id = c.question_id
            LEFT JOIN explanations e ON q.id = e.question_id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ?
            GROUP BY 
                q.id, 
                q.text, 
                q.type, 
                q.create_at, 
                q.update_at, 
                e.explanation_text,
                u.name
        `;

        try {
            const connection = await this.getConnection();
            const [rows] = await connection.query(dataQuery, [id]);

            if (rows.length === 0) {
                return null;
            }

            const question = {
                id: rows[0].id,
                text: rows[0].text,
                type: rows[0].type,
                choices: Array.isArray(rows[0].choices)
                    ? rows[0].choices.filter((choice) => choice !== null)
                    : [],
                explanation_text: rows[0].explanation_text,
                author_name: rows[0].author_name,
                created_at: rows[0].created_at,
                updated_at: rows[0].updated_at,
            };

            // 選択肢が存在しない場合のチェック
            if (!question.choices.length) {
                console.warn(`No choices found for question ID: ${id}`);
            }

            return question;
        } catch (error) {
            console.error('Error in getQuestionWithChoices:', error);
            throw error;
        }
    }

    async getQuestionsWithStats() {
        const connection = await this.getConnection();
        const [rows] = await connection.query(
            `SELECT q.*, 
                    COUNT(DISTINCT c.id) as choice_count,
                    COUNT(DISTINCT a.id) as answer_count
             FROM questions q
             LEFT JOIN choices c ON q.id = c.question_id
             LEFT JOIN answers a ON q.id = a.question_id
             GROUP BY q.id`
        );
        return rows;
    }
}

module.exports = new QuestionRepository();
