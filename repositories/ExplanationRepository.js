const BaseRepository = require('../database/BaseRepository');

class ExplanationRepository extends BaseRepository {
    constructor() {
        super('explanations');
    }

    // 問題IDに紐づく解説を取得
    async findByQuestionId(questionId) {
        const query = `
            SELECT explanation_text
            FROM ${this.tableName}
            WHERE question_id = ?
        `;
        const [rows] = await this.executeQuery(query, [questionId]);
        return rows;
    }

    // 問題IDに紐づく解説を削除
    async deleteByQuestionId(questionId) {
        const query = `
            DELETE FROM ${this.tableName}
            WHERE question_id = ?
        `;
        return this.executeQuery(query, [questionId]);
    }
}

module.exports = new ExplanationRepository();
