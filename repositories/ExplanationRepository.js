const BaseRepository = require('../database/BaseRepository');

class ExplanationRepository extends BaseRepository {
    constructor() {
        super('explanations');
    }

    async findByQuestionId(questionId) {
        return await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE question_id = ?`,
            [questionId]
        );
    }
}

module.exports = new ExplanationRepository();
