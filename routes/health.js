const express = require('express');
const router = express.Router();
const db = require('../database/DBConnection');

/**
 * データベース接続の健全性をチェックするエンドポイント
 */
router.get('/ping', async (req, res) => {
    try {
        const isAlive = await db.ping();
        if (isAlive) {
            return res.status(200).json({
                status: 'success',
                message: 'データベース接続は正常です',
                timestamp: new Date().toISOString(),
            });
        } else {
            return res.status(503).json({
                status: 'error',
                message: 'データベース接続に問題があります',
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error('ヘルスチェックエラー:', error);
        return res.status(500).json({
            status: 'error',
            message: 'ヘルスチェック実行中にエラーが発生しました',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

module.exports = router;
