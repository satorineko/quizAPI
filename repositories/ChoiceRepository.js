const BaseRepository = require('../database/BaseRepository');

class ChoiceRepository extends BaseRepository {
    constructor() {
        super('choices');
    }

    async findByQuestionId(questionId) {
        return await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE question_id = ?`,
            [questionId]
        );
    }

    async findCorrectChoice(questionId) {
        return await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE question_id = ? AND is_correct = 1`,
            [questionId]
        );
    }
}

module.exports = new ChoiceRepository();
