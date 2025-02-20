const express = require('express');
const router = express.Router();
const QuestionRepository = require('../repositories/QuestionRepository');
const ChoiceRepository = require('../repositories/ChoiceRepository');
const ExplanationRepository = require('../repositories/ExplanationRepository');

// バリデーションミドルウェア
const validateFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(
            (field) => req.body[field] === undefined
        );
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: '必要なデータが不足しています',
                missingFields,
            });
        }
        next();
    };
};

// 全ての質問を取得（ページネーション付き）
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // 基本的な問題データを取得
        const questionsData = await QuestionRepository.findAllPaginated(
            page,
            limit
        );

        // 各問題の選択肢と解説を取得
        const enhancedData = await Promise.all(
            questionsData.data.map(async (question) => {
                const [choices, explanation] = await Promise.all([
                    ChoiceRepository.findByQuestionId(question.id),
                    ExplanationRepository.findByQuestionId(question.id),
                ]);

                return {
                    ...question,
                    choices: choices || [],
                    explanation_text: explanation?.explanation_text || null,
                };
            })
        );

        res.json({
            data: enhancedData,
            pagination: questionsData.pagination,
        });
    } catch (error) {
        console.error('Error getting questions:', error);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

// 特定の質問を取得
router.get('/:id', async (req, res) => {
    try {
        const [question, choices, explanation] = await Promise.all([
            QuestionRepository.findQuestionWithDetails(req.params.id),
            ChoiceRepository.findByQuestionId(req.params.id),
            ExplanationRepository.findByQuestionId(req.params.id),
        ]);

        if (!question) {
            return res.status(404).json({ error: '質問が見つかりません' });
        }

        const response = {
            ...question,
            choices: choices || [],
            explanation_text: explanation?.explanation_text || null,
        };

        res.json(response);
    } catch (error) {
        console.error('Error getting question:', error);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

// 新しい質問を作成
router.post('/', validateFields(['text', 'type']), async (req, res) => {
    try {
        const { text, type } = req.body;
        const result = await QuestionRepository.create({ text, type });
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

// 質問を更新
router.put('/:id', validateFields(['text', 'type']), async (req, res) => {
    try {
        const { text, type } = req.body;
        const result = await QuestionRepository.update(req.params.id, {
            text,
            type,
        });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '質問が見つかりません' });
        }
        res.json({ message: '質問が更新されました' });
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

// 質問を削除
router.delete('/:id', async (req, res) => {
    try {
        await ExplanationRepository.deleteByQuestionId(req.params.id);
        await ChoiceRepository.deleteByQuestionId(req.params.id);
        const result = await QuestionRepository.delete(req.params.id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '質問が見つかりません' });
        }
        res.json({ message: '質問が削除されました' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

module.exports = router;
