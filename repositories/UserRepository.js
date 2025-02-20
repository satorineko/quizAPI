const BaseRepository = require('../database/BaseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async findByName(name) {
        return await this.executeQuery(
            `SELECT * FROM ${this.tableName} WHERE name = ?`,
            [name]
        );
    }

    async findWithQuestions(userId) {
        const query = `
            SELECT 
                u.*,
                q.id as question_id,
                q.title,
                q.text,
                q.type
            FROM users u
            LEFT JOIN questions q ON u.id = q.user_id
            WHERE u.id = ?
        `;
        return await this.executeQuery(query, [userId]);
    }
}

module.exports = new UserRepository();
