const express = require('express');
const router = express.Router();
const QuestionRepository = require('../repositories/QuestionRepository');

// タイプ別の問題数
router.get('/by-type', async (req, res) => {
    try {
        const stats = await QuestionRepository.countByType();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 期間別の問題作成数
router.get('/by-period', async (req, res) => {
    const { period = 'month' } = req.query;
    try {
        const stats = await QuestionRepository.countByPeriod(period);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ユーザー別の問題作成数
router.get('/by-user', async (req, res) => {
    try {
        const stats = await QuestionRepository.countByUser();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
