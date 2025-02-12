const BaseRepository = require('../database/BaseRepository');

class AnswerRepository extends BaseRepository {
    constructor() {
        super('answers');
    }

    async findByQuestionId(questionId) {
        return await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE question_id = ?`,
            [questionId]
        );
    }
}

module.exports = new AnswerRepository();
