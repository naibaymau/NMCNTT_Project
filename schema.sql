-- Tạo bảng người dùng (users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'customer',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo sẵn một tài khoản Admin mẫu
-- Mật khẩu mặc định là: admin123
INSERT INTO `users` (`name`, `email`, `password`, `role`) 
VALUES ('Quản trị viên', 'admin@gptea.com', '$2y$10$O0a95Y8.8Hq2fLhH7iR6A.aV1jG7T/P1p3R5U1M.0fK1b0X8o6n9G', 'admin')
ON DUPLICATE KEY UPDATE `id`=`id`;

