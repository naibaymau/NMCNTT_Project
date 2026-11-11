<?php
// api/register.php - Xử lý đăng ký tài khoản
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Phương thức không hợp lệ']);
    exit;
}

// Nhận dữ liệu JSON gửi lên từ frontend
$input = json_decode(file_get_contents('php://input'), true);

$name  = trim($input['name'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$pass  = $input['password'] ?? '';

// Kiểm tra dữ liệu đầu vào
if (empty($name) || empty($email) || empty($pass)) {
    echo json_encode(['status' => 'error', 'message' => 'Vui lòng điền đầy đủ họ tên, email và mật khẩu!']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Email không đúng định dạng!']);
    exit;
}

if (strlen($pass) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Mật khẩu phải từ 6 ký tự trở lên!']);
    exit;
}

try {
    // 1. Kiểm tra email đã tồn tại hay chưa
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Email này đã được đăng ký trước đó!']);
        exit;
    }

    // 2. Mã hóa mật khẩu bảo mật trước khi lưu vào DB
    $hash = password_hash($pass, PASSWORD_DEFAULT);

    // 3. Lưu người dùng mới vào MySQL
    $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $email, $hash, 'customer']);
    $userId = $pdo->lastInsertId();

    echo json_encode([
        'status' => 'success',
        'message' => 'Đăng ký tài khoản thành công!',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'customer'
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Lỗi máy chủ: ' . $e->getMessage()]);
}

