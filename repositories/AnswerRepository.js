const BaseRepository = require('../database/BaseRepository');

class AnswerRepository extends BaseRepository {
    constructor() {
        super('answers');
    }

    async getAnswerByQuestionId(questionId) {
        const connection = await this.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM answers WHERE question_id = ?',
            [questionId]
        );
        return rows[0];
    }

    async updateAnswerText(questionId, answerText) {
        const connection = await this.getConnection();
        const [result] = await connection.query(
            'UPDATE answers SET answer_text = ? WHERE question_id = ?',
            [answerText, questionId]
        );
        return result;
    }

    async deleteByQuestionId(questionId) {
        const connection = await this.getConnection();
        const [result] = await connection.query(
            'DELETE FROM answers WHERE question_id = ?',
            [questionId]
        );
        return result;
    }
}

module.exports = new AnswerRepository();
