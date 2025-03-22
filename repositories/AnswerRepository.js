const BaseRepository = require('../database/BaseRepository');

class AnswerRepository extends BaseRepository {
    constructor() {
        super('answers');
    }

    async getAnswerByQuestionId(questionId) {
        const [rows] = await this.executeQuery(
            'SELECT * FROM answers WHERE question_id = ?',
            [questionId]
        );
        return rows[0];
    }

    async updateAnswerText(questionId, answerText) {
        const result = await this.executeQuery(
            'UPDATE answers SET answer_text = ? WHERE question_id = ?',
            [answerText, questionId]
        );
        return result;
    }

    async deleteByQuestionId(questionId) {
        const result = await this.executeQuery(
            'DELETE FROM answers WHERE question_id = ?',
            [questionId]
        );
        return result;
    }
}

module.exports = new AnswerRepository();
