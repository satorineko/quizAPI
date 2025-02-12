require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

function connectDB() {
    const now = new Date();
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                console.error(`[${now.toLocaleString()}] Error connecting to MySQL:`, err);
                reject(err);
                return;
            }
            console.log(`[${now.toLocaleString()}] connecting to MySQL:`);
            resolve();
        });
    });
}

function executeQuery(query, values = []) {
    const now = new Date();
    return new Promise((resolve, reject) => {
        connection.query(query, values, (error, results) => {
            if (error) {
                console.error(
                    `[${now.toLocaleString()}] Error executing query:`,
                    error
                );
                reject(error);
            }
            console.log(
                `[${now.toLocaleString()}] executing query:\n`,
                results
            );
            resolve(results);
        });
    });
}

function show_tables() {
    return executeQuery('show tables');
}

function get_questions() {
    return executeQuery('SELECT * FROM questions');
}

function get_question(id) {
    return executeQuery('SELECT * FROM questions WHERE id = ?', [id]);
}

function get_choices(question_id) {
    return executeQuery('SELECT * FROM choices WHERE question_id = ?', [question_id]);
}

function get_correct_choices(question_id) {
    return executeQuery('SELECT * FROM choices WHERE question_id = ? AND is_correct = 1', [question_id]);
}

function get_answer_text(question_id) {
    return executeQuery('SELECT * FROM answers WHERE question_id = ?', [question_id]);
}

function create_question(text, type) {
    return executeQuery(
        'INSERT INTO questions (text, type) VALUES (?, ?)',
        [text, type]
    );
}

function create_choices_answer(question_id, choice_text, is_correct) {
    return executeQuery(
        'INSERT INTO choices (question_id, choice_text, is_correct) VALUES (?, ?, ?)',
        [question_id, choice_text, is_correct]
    );
}

function create_text_answer(question_id, answer_text) {
    return executeQuery(
        'INSERT INTO answers (question_id, answer_text) VALUES (?, ?)',
        [question_id, answer_text]
    );
}

function update_question(id, text, type) {
    return executeQuery(
        'UPDATE questions SET text = ?, type = ? WHERE id = ?',
        [text, type, id]
    );
}

function update_answer(id, answer_text) {
    return executeQuery(
        'UPDATE answers SET answer_text = ? WHERE question_id = ?',
        [answer_text, id]
    );
}

function delete_answer_text(question_id) {
    return executeQuery('DELETE FROM answers WHERE question_id = ?', [question_id]);
}

function delete_choices(question_id) {
    return executeQuery('DELETE FROM choices WHERE question_id = ?', [question_id]);
}

function delete_question(id) {
    return executeQuery('DELETE FROM questions WHERE id = ?', [id]);
}

module.exports = {
    connectDB,
    show_tables,
    get_questions,
    get_question,
    get_choices,
    get_correct_choices,
    get_answer_text,
    create_question,
    create_choices_answer,
    create_text_answer,
    update_question,
    update_answer,
    delete_answer_text,
    delete_choices,
    delete_question,
};
