require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const DBConnection = require('./database/DBConnection');

const app = express();
const port = process.env.PORT || 4000;

// ミドルウェアの設定
app.use(cors());
app.use(bodyParser.json());

// グローバルエラーハンドリング
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'サーバーエラーが発生しました',
        message:
            process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// ルートの設定
app.use('/api/questions', require('./routes/questions'));

// データベース接続とサーバー起動
async function startServer() {
    try {
        await DBConnection.getConnection();
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
