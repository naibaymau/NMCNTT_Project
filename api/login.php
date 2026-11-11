<?php
// api/login.php - Xử lý đăng nhập tài khoản
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Phương thức không hợp lệ']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$email = strtolower(trim($input['email'] ?? ''));
$pass  = $input['password'] ?? '';

if (empty($email) || empty($pass)) {
    echo json_encode(['status' => 'error', 'message' => 'Vui lòng nhập email và mật khẩu!']);
    exit;
}

try {
    // 1. Tìm tài khoản theo email
    $stmt = $pdo->prepare('SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // 2. Kiểm tra mật khẩu (đối chiếu chuỗi hash)
    if (!$user || !password_verify($pass, $user['password'])) {
        echo json_encode(['status' => 'error', 'message' => 'Email hoặc mật khẩu không chính xác!']);
        exit;
    }

    // 3. Đăng nhập thành công -> trả về thông tin user
    echo json_encode([
        'status' => 'success',
        'message' => 'Đăng nhập thành công!',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Lỗi máy chủ: ' . $e->getMessage()]);
}

