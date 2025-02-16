const BaseRepository = require('../database/BaseRepository');

class ChoiceRepository extends BaseRepository {
    constructor() {
        super('choices');
    }

    async getChoicesByQuestionId(questionId) {
        const connection = await this.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM choices WHERE question_id = ?',
            [questionId]
        );
        return rows;
    }

    async getCorrectChoice(questionId) {
        const connection = await this.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM choices WHERE question_id = ? AND is_correct = 1',
            [questionId]
        );
        return rows[0];
    }

    async deleteByQuestionId(questionId) {
        const connection = await this.getConnection();
        const [result] = await connection.query(
            'DELETE FROM choices WHERE question_id = ?',
            [questionId]
        );
        return result;
    }
}

module.exports = new ChoiceRepository();
