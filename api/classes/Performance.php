<?php

class Performance {
    private PDO $conn;

    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    public function createReview(int $userId, int $reviewerId, string $reviewDate, int $rating, ?string $comments = null): int {
        $stmt = $this->conn->prepare('
            INSERT INTO performance_reviews (user_id, reviewer_id, review_date, rating, comments) 
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$userId, $reviewerId, $reviewDate, $rating, $comments]);
        return (int)$this->conn->lastInsertId();
    }

    public function getReviewsForUser(int $userId): array {
        $stmt = $this->conn->prepare('
            SELECT pr.*, u.name as reviewer_name 
            FROM performance_reviews pr 
            JOIN users u ON pr.reviewer_id = u.id 
            WHERE pr.user_id = ? 
            ORDER BY pr.review_date DESC
        ');
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllReviews(): array {
        $stmt = $this->conn->query('
            SELECT pr.*, u1.name as employee_name, u2.name as reviewer_name 
            FROM performance_reviews pr 
            JOIN users u1 ON pr.user_id = u1.id 
            JOIN users u2 ON pr.reviewer_id = u2.id 
            ORDER BY pr.review_date DESC
        ');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findReview(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM performance_reviews WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function updateReview(int $id, array $data): bool {
        $stmt = $this->conn->prepare('
            UPDATE performance_reviews 
            SET review_date = ?, rating = ?, comments = ? 
            WHERE id = ?
        ');
        return $stmt->execute([
            $data['review_date'],
            $data['rating'],
            $data['comments'] ?? null,
            $id
        ]);
    }

    public function deleteReview(int $id): bool {
        $stmt = $this->conn->prepare('DELETE FROM performance_reviews WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
?>
