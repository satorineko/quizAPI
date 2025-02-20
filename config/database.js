// データベース接続設定
module.exports = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quiz_db',
    port: process.env.DB_PORT || 3306,
    // SSL設定（必要な場合）
    ssl:
        process.env.DB_SSL === 'true'
            ? {
                  rejectUnauthorized: false,
              }
            : false,
};
