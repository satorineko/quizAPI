# アプリケーションアーキテクチャ

## システム概要図

```mermaid
graph TB
    Client[クライアントアプリケーション]
    API[API Layer]
    Route[Route Layer]
    Service[Service Layer]
    Repo[Repository Layer]
    DB[(MySQL Database)]

    Client <--> API
    API <--> Route
    Route <--> Service
    Service <--> Repo
    Repo <--> DB

    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style API fill:#bbf,stroke:#333,stroke-width:2px
    style Route fill:#ddf,stroke:#333,stroke-width:2px
    style Service fill:#ddf,stroke:#333,stroke-width:2px
    style Repo fill:#ddf,stroke:#333,stroke-width:2px
    style DB fill:#bfb,stroke:#333,stroke-width:2px
```

## コンポーネント構成

```mermaid
graph TB
    subgraph API Layer
        Express[Express.js]
        Middleware[ミドルウェア]
        ErrorHandler[エラーハンドラー]
    end

    subgraph Route Layer
        QuestionRoutes[問題ルート]
        ChoiceRoutes[選択肢ルート]
        AnswerRoutes[回答ルート]
        ValidationMiddleware[バリデーション]
    end

    subgraph Service Layer
        QuestionService[問題サービス]
        ChoiceService[選択肢サービス]
        AnswerService[回答サービス]
    end

    subgraph Repository Layer
        BaseRepo[基底リポジトリ]
        QuestionRepo[問題リポジトリ]
        ChoiceRepo[選択肢リポジトリ]
        AnswerRepo[回答リポジトリ]
        DBConnection[データベース接続]
    end

    Express --> Middleware
    Middleware --> ErrorHandler
    Express --> QuestionRoutes
    Express --> ChoiceRoutes
    Express --> AnswerRoutes

    QuestionRoutes --> ValidationMiddleware
    QuestionRoutes --> QuestionService
    ChoiceRoutes --> ValidationMiddleware
    ChoiceRoutes --> ChoiceService
    AnswerRoutes --> ValidationMiddleware
    AnswerRoutes --> AnswerService

    QuestionService --> QuestionRepo
    ChoiceService --> ChoiceRepo
    AnswerService --> AnswerRepo

    QuestionRepo --> BaseRepo
    ChoiceRepo --> BaseRepo
    AnswerRepo --> BaseRepo
    BaseRepo --> DBConnection
```

## レイヤー別の責務

### API Layer

-   HTTP リクエスト/レスポンスの処理
-   CORS の設定
-   グローバルエラーハンドリング
-   リクエストボディのパース

### Route Layer

-   URL ルーティング
-   リクエストの検証
-   レスポンスの整形
-   エラーハンドリング

### Service Layer

-   ビジネスロジックの実装
-   トランザクション管理
-   データの加工
-   バリデーション

### Repository Layer

-   データベース操作の抽象化
-   SQL クエリの実行
-   データの永続化
-   エンティティの管理

## データフロー

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant API as API Layer
    participant Route as Route Layer
    participant Service as Service Layer
    participant Repo as Repository Layer
    participant DB as Database

    Client->>API: HTTPリクエスト
    API->>Route: ルーティング
    Route->>Service: データ処理要求
    Service->>Repo: データ操作要求
    Repo->>DB: SQLクエリ
    DB-->>Repo: クエリ結果
    Repo-->>Service: データオブジェクト
    Service-->>Route: 処理済みデータ
    Route-->>API: レスポンスデータ
    API-->>Client: HTTPレスポンス
```

## セキュリティ対策

```mermaid
graph TB
    subgraph Security Measures
        Input[入力検証]
        SQL[SQLインジェクション対策]
        XSS[XSS対策]
        CORS[CORS設定]
        ENV[環境変数管理]
    end

    Input --> Validation[バリデーションミドルウェア]
    SQL --> PreparedStatements[プリペアドステートメント]
    XSS --> Sanitization[サニタイズ処理]
    CORS --> CORSConfig[CORS設定]
    ENV --> DotEnv[dotenv]
```
