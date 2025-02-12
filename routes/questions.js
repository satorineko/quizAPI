const express = require('express');
const router = express.Router();
const QuestionRepository = require('../repositories/QuestionRepository');

// 問題一覧取得（ページネーション付き）
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, type } = req.query;
    try {
        const questions = type
            ? await QuestionRepository.findByTypePaginated(type, page, limit)
            : await QuestionRepository.findAllPaginated(page, limit);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 問題詳細取得（関連データ含む）
router.get('/:id', async (req, res) => {
    try {
        const question = await QuestionRepository.findWithAllRelations(
            req.params.id
        );
        if (!question) {
            return res.status(404).json({ error: '問題が見つかりません' });
        }
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 問題作成
router.post('/', async (req, res) => {
    const { title, text, type, choices, answer, explanation, userId } =
        req.body;

    try {
        await QuestionRepository.db.transaction(async (connection) => {
            // 問題の作成
            const question = await QuestionRepository.create({
                title,
                text,
                type,
                user_id: userId,
            });

            if (type === 'choice') {
                // 選択肢の作成
                for (const choice of choices) {
                    await connection.execute(
                        'INSERT INTO choices (question_id, choice_text, is_correct) VALUES (?, ?, ?)',
                        [question.insertId, choice.text, choice.isCorrect]
                    );
                }
            } else {
                // テキスト回答の作成
                await connection.execute(
                    'INSERT INTO answers (question_id, answer_text) VALUES (?, ?)',
                    [question.insertId, answer]
                );
            }

            // 解説の作成
            await connection.execute(
                'INSERT INTO explanations (question_id, explanation_text) VALUES (?, ?)',
                [question.insertId, explanation]
            );
        });

        res.status(201).json({ message: '問題が作成されました' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 問題更新
router.put('/:id', async (req, res) => {
    // 実装の詳細は省略
});

// 問題削除
router.delete('/:id', async (req, res) => {
    // 実装の詳細は省略
});

module.exports = router;
