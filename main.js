const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;

const cors = require('cors');
app.use(cors());

var mysql = require('./mysql.js');
// アプリケーションの起動時
async function initializeApp() {
    try {
        await mysql.connectDB();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
}

// ミドルウェアの設定
app.use(bodyParser.json());

// エラーハンドリング用のミドルウェア
const errorHandler = (res, error) => {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Database error' });
};

// レスポンスヘルパー
const validateRequest = (req, res, requiredFields, useQuery = false) => {
    const missingFields = requiredFields.filter((field) =>
        useQuery ? req.query[field] === undefined : req.body[field] === undefined
    );
    if (missingFields.length > 0) {
        return res
            .status(400)
            .json({ error: '必要なデータが不足しています。' });
    }
    return null;
};

// ルートハンドラー
app.get('/tables', async (req, res) => {
    try {
        res.json(await mysql.show_tables());
    } catch (error) {
        errorHandler(res, error);
    }
});

app.get('/questions', async (req, res) => {
    try {
        res.json(await mysql.get_questions());
    } catch (error) {
        errorHandler(res, error);
    }
});

app.get('/questions/:id', async (req, res) => {
    try {
        res.json(await mysql.get_question(req.params.id));
    } catch (error) {
        errorHandler(res, error);
    }
});

app.get('/choices', async (req, res) => {
    const validation = validateRequest(req, res, ['question_id'], true);
    if (validation) return validation;

    try {
        res.json(await mysql.get_choices(req.query.question_id));
    } catch (error) {
        errorHandler(res, error);
    }
});

app.post('/correct_choices', async (req, res) => {
    const validation = validateRequest(req, res, ['question_id', 'choice_id']);
    if (validation) return validation;

    try {
        const { question_id, choice_id } = req.body;
        const correct_choice = await mysql.get_correct_choices(question_id);

        res.json({
            is_correct: correct_choice[0].id === choice_id,
            correct_choice_id: correct_choice[0].id,
        });
    } catch (error) {
        errorHandler(res, error);
    }
});

app.post('/answer_text', async (req, res) => {
    const validation = validateRequest(req, res, ['question_id']);
    if (validation) return validation;

    try {
        const { question_id } = req.body;
        const answer_item = await mysql.get_answer_text(question_id);

        res.json({
            answer_text: answer_item[0].answer_text,
        });
    } catch (error) {
        errorHandler(res, error);
    }
});

app.post('/questions/create', async (req, res) => {
    const validation = validateRequest(req, res, [
        'text',
        'type',
    ]);
    if (validation) return validation;

    try {
        const { text, type } = req.body;
        res.json(await mysql.create_question(text, type));
    } catch (error) {
        errorHandler(res, error);
    }
});

app.post('/choices/create', async (req, res) => {
    const validation = validateRequest(req, res, [
        'question_id',
        'choice_text',
        'is_correct',
    ]);
    if (validation) return validation;
    
    try {
        const { question_id, choice_text, is_correct } = req.body;
        res.json(await mysql.create_choices_answer(question_id, choice_text, is_correct));
    } catch (error) {
        errorHandler(res, error);
    }
});

app.post('/answers/create', async (req, res) => {
    const validation = validateRequest(req, res, [
        'question_id',
        'answer_text',
    ]);
    if (validation) return validation;

    try {
        const { question_id, answer_text } = req.body;
        res.json(await mysql.create_text_answer(question_id, answer_text));
    } catch (error) {
        errorHandler(res, error);
    }
});

app.put('/questions/update', async (req, res) => {
    const validation = validateRequest(req, res, [
        'id',
        'text',
        'type',
    ]);
    if (validation) return validation;

    try {
        const { id, text, type } = req.body;
        res.json(await mysql.update_question(id, text, type));
    } catch (error) {
        errorHandler(res, error);
    }
});

app.put('/answers/:id', async (req, res) => {
    const validation = validateRequest(req, res, [
        'answer_text',
    ]);
    if (validation) return validation;

    try {
        const { answer_text } = req.body;
        res.json(await mysql.update_answer(req.params.id, answer_text));
    } catch (error) {
        errorHandler(res, error);
    }
});

app.delete('/questions/delete/:id', async (req, res) => {
    try {
        await mysql.delete_answer_text(req.params.id);
        await mysql.delete_choices(req.params.id);
        await mysql.delete_question(req.params.id);
        res.status(200).json({ message: '問題が削除されました' });
    } catch (error) {
        errorHandler(res, error);
    }
});

app.delete('/choices/:id', async (req, res) => {
    try {
        await mysql.delete_choices(req.params.id);
        res.status(200).json({ message: '選択肢が削除されました' });
    } catch (error) {
        errorHandler(res, error);
    }
});

// サーバーを起動
app.listen(port, () => {
    initializeApp();
    console.log(`Server is running on http://localhost:${port}`);
});
