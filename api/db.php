<?php
// api/db.php - Kết nối cơ sở dữ liệu MySQL trên InfinityFree
header('Content-Type: application/json; charset=utf-8');

// ==============================================================================
// ĐIỀN THÔNG TIN TỪ INFINITYFREE VÀO 4 DÒNG DƯỚI ĐÂY:
// ==============================================================================
$db_host = 'sqlXXX.infinityfree.com'; // MySQL Hostname trên InfinityFree
$db_name = 'if0_xxxx_gptea';          // MySQL Database Name
$db_user = 'if0_xxxx';                // MySQL Username
$db_pass = 'YOUR_INFINITYFREE_PASS';  // Mật khẩu Hosting InfinityFree
// ==============================================================================

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Không thể kết nối đến cơ sở dữ liệu: ' . $e->getMessage()
    ]);
    exit;
}

