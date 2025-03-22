const express = require('express');
const router = express.Router();
const QuestionRepository = require('../repositories/QuestionRepository');
const ChoiceRepository = require('../repositories/ChoiceRepository');
const ExplanationRepository = require('../repositories/ExplanationRepository');
const AnswerRepository = require('../repositories/AnswerRepository');

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
                // 基本データを含むレスポンスオブジェクトを作成
                const response = { ...question };

                if (question.type === 'choice') {
                    // 選択式問題の場合
                    const choices = await ChoiceRepository.findByQuestionId(
                        question.id
                    );
                    response.choices = choices || [];
                } else if (question.type === 'text') {
                    // 記述式問題の場合
                    const answer = await AnswerRepository.getAnswerByQuestionId(
                        question.id
                    );
                    response.answer_text = answer?.answer_text || null;
                }

                // 共通で解説を取得
                const explanation =
                    await ExplanationRepository.findByQuestionId(question.id);
                response.explanation_text =
                    explanation?.explanation_text || null;

                return response;
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
        // 問題の基本情報を取得
        const question = await QuestionRepository.findQuestionWithDetails(
            req.params.id
        );

        if (!question) {
            return res.status(404).json({ error: '問題が見つかりません' });
        }

        // 基本データを含むレスポンスオブジェクトを作成
        const response = { ...question };

        if (question.type === 'choice') {
            // 選択式問題の場合
            const choices = await ChoiceRepository.findByQuestionId(
                req.params.id
            );
            response.choices = choices || [];
        } else if (question.type === 'text') {
            // 記述式問題の場合
            const answer = await AnswerRepository.getAnswerByQuestionId(
                req.params.id
            );
            response.answer_text = answer?.answer_text || null;
        }

        // 共通で解説を取得
        const explanation = await ExplanationRepository.findByQuestionId(
            req.params.id
        );
        response.explanation_text = explanation?.explanation_text || null;

        res.json({
            data: response,
        });
    } catch (error) {
        console.error('Error getting question:', error);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

// 新しい質問を作成
router.post('/', validateFields(['text', 'type']), async (req, res) => {
    try {
        const { text, type, choices, answer_text } = req.body;

        // 問題の作成
        const result = await QuestionRepository.create({ text, type });
        const questionId = result.insertId;

        // 問題タイプに応じた処理
        if (type === 'choice') {
            // 選択肢の登録（choices配列が提供されている場合）
            if (Array.isArray(choices) && choices.length > 0) {
                for (const choice of choices) {
                    if (choice.text) {
                        await ChoiceRepository.create({
                            question_id: questionId,
                            text: choice.text,
                            is_correct: choice.is_correct ? 1 : 0,
                        });
                    }
                }
            }
        } else if (type === 'text' && answer_text) {
            // 記述式問題の場合、AnswerRepositoryを使用して正解テキストを保存
            await AnswerRepository.create({
                question_id: questionId,
                answer_text: answer_text,
            });
        }

        res.status(201).json({ id: questionId });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

// 質問を更新
router.put('/:id', validateFields(['text', 'type']), async (req, res) => {
    try {
        const questionId = req.params.id;
        const { text, type, choices, answer_text } = req.body;

        // 既存の質問データを取得して存在確認
        const existingQuestion =
            await QuestionRepository.findQuestionWithDetails(questionId);
        if (!existingQuestion) {
            return res.status(404).json({ error: '質問が見つかりません' });
        }

        // 質問の基本情報を更新
        const result = await QuestionRepository.update(questionId, {
            text,
            type,
        });

        // 問題タイプに応じた関連データの処理
        try {
            // 1. 古いデータを削除
            try {
                await ChoiceRepository.deleteByQuestionId(questionId);
            } catch (deleteChoiceError) {
                console.warn('選択肢削除中のエラー:', deleteChoiceError);
            }

            try {
                await AnswerRepository.deleteByQuestionId(questionId);
            } catch (deleteAnswerError) {
                console.warn('解答削除中のエラー:', deleteAnswerError);
            }

            // 2. 新しいデータを登録
            if (type === 'choice') {
                // 選択肢の登録（choices配列が提供されている場合）
                if (Array.isArray(choices) && choices.length > 0) {
                    for (const choice of choices) {
                        if (choice.text) {
                            await ChoiceRepository.create({
                                question_id: questionId,
                                text: choice.text,
                                is_correct: choice.is_correct ? 1 : 0,
                            });
                        }
                    }
                }
            } else if (type === 'text' && answer_text) {
                // 記述式問題の場合、AnswerRepositoryを使用して正解テキストを保存
                await AnswerRepository.create({
                    question_id: questionId,
                    answer_text: answer_text,
                });
            }
        } catch (dataError) {
            console.error('データ更新処理中のエラー:', dataError);
            return res
                .status(500)
                .json({ error: '関連データの更新に失敗しました' });
        }

        res.json({
            message: '質問が更新されました',
            id: questionId,
        });
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
        await AnswerRepository.deleteByQuestionId(req.params.id);
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
