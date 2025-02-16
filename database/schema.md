# データベーススキーマ

```mermaid
erDiagram
    questions ||--o{ choices : has
    questions ||--o| answers : has
    questions ||--o| explanations : has
    questions ||--o{ user_answers : receives
    users ||--o{ questions : creates
    users ||--o{ user_answers : submits

    questions {
        int id PK
        string text
        string type
        int user_id FK
        datetime create_at
        datetime update_at
    }

    choices {
        int id PK
        int question_id FK
        string text
        boolean is_correct
        datetime created_at
        datetime updated_at
    }

    answers {
        int id PK
        int question_id FK
        string answer_text
        datetime created_at
        datetime updated_at
    }

    explanations {
        int id PK
        int question_id FK
        string explanation_text
        datetime created_at
        datetime updated_at
    }

    users {
        int id PK
        string name
        string email
        string password_hash
        datetime created_at
        datetime updated_at
    }

    user_answers {
        int id PK
        int user_id FK
        int question_id FK
        int choice_id FK "選択式の場合"
        string text_answer "記述式の場合"
        boolean is_correct
        datetime created_at
    }
```

## テーブル詳細

### questions

-   問題を管理するテーブル
-   `type`は'multiple_choice'または'text'
-   `user_id`は作成者の ID

### choices

-   選択式問題の選択肢を管理
-   `is_correct`は正解の選択肢を示す
-   各問題に複数の選択肢が紐づく

### answers

-   記述式問題の解答を管理
-   各問題に 1 つの解答が紐づく

### explanations

-   問題の解説を管理
-   各問題に 1 つの解説が紐づく

### users

-   ユーザー情報を管理
-   問題の作成者情報を保持

### user_answers

-   ユーザーの回答履歴を管理
-   選択式と記述式の両方の回答に対応
-   正誤情報も保持
