const BaseRepository = require('../database/BaseRepository');

class ChoiceRepository extends BaseRepository {
    constructor() {
        super('choices');
    }

    // 問題IDに紐づく選択肢を取得
    async findByQuestionId(questionId) {
        const query = `
                SELECT id, text, is_correct
                FROM ${this.tableName}
                WHERE question_id = ?
                ORDER BY id
            `;
        const [rows] = await this.executeQuery(query, [questionId]);
        return rows;
    }

    async getCorrectChoice(questionId) {
        const [rows] = await this.executeQuery(
            'SELECT * FROM choices WHERE question_id = ? AND is_correct = 1',
            [questionId]
        );
        return rows[0];
    }

    async deleteByQuestionId(questionId) {
        const [result] = await this.executeQuery(
            'DELETE FROM choices WHERE question_id = ?',
            [questionId]
        );
        return result;
    }
}

module.exports = new ChoiceRepository();
