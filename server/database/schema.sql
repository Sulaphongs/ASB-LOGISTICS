-- =====================================================================
-- ASB LOGISTICS (React + Node ຮຸ່ນ) — ຖານຂໍ້ມູນ
-- =====================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NULL,
    phone VARCHAR(30) NULL,
    role_key ENUM('admin','staff') DEFAULT 'staff',
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    facebook_name VARCHAR(150) NULL,
    address TEXT NULL,
    province VARCHAR(100) NULL,
    notes TEXT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    shipping_type ENUM('land','air') DEFAULT 'land',
    calc_method ENUM('per_kg','per_cbm') DEFAULT 'per_kg',
    rate DECIMAL(12,2) NOT NULL,
    min_charge DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'LAK',
    is_default TINYINT(1) DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_code VARCHAR(30) UNIQUE NOT NULL,
    china_tracking_no VARCHAR(100) NULL,
    customer_id INT NOT NULL,
    item_description VARCHAR(255) NULL,
    shop_link TEXT NULL,
    quantity INT DEFAULT 1,
    weight_kg DECIMAL(10,2) NULL,
    volume_cbm DECIMAL(10,4) NULL,
    declared_value_cny DECIMAL(12,2) NULL,
    pricing_rule_id INT NULL,
    shipping_fee DECIMAL(12,2) DEFAULT 0,
    other_fee DECIMAL(12,2) DEFAULT 0,
    total_fee DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'LAK',
    payment_status ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status ENUM('ordered','arrived_cn_warehouse','shipped','arrived_la_warehouse','out_for_delivery','delivered','cancelled') DEFAULT 'ordered',
    cn_warehouse_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    la_warehouse_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    notes TEXT NULL,
    photo_path VARCHAR(255) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tracking (tracking_code),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS package_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    note VARCHAR(255) NULL,
    changed_by INT NULL,
    changed_by_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_package (package_id),
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(100) NULL,
    action_type VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    old_data LONGTEXT NULL,
    new_data LONGTEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SEED DATA
-- ໝາຍເຫດ: ລະຫັດຜ່ານຂອງ admin ໃນນີ້ຖືກ hash ໄວ້ນອກລະບົບ (PHP bcrypt) —
-- ຫຼັງ import ແລ້ວ ແນະນຳໃຫ້ແລ່ນ `npm run seed` (ໃນ server/) ເພື່ອລີເຊັດຜ່ານ
-- bcryptjs ໂດຍກົງ, ຮັບປະກັນວ່າ compatible 100% ກັບລະບົບ verify.
-- =====================================================================
INSERT IGNORE INTO users (username, password_hash, full_name, role_key, status) VALUES
    ('admin', '$2y$12$WmhgtAdFDpVOcBX/RHRj4OoHHkC1GEnDu9n5pNLEK.lRwsDGQV7ce', 'Administrator', 'admin', 'active');
    -- default password: admin123 — ປ່ຽນທັນທີ ຫຼື ແລ່ນ: npm run seed admin <ລະຫັດຜ່ານໃໝ່>

INSERT IGNORE INTO pricing_rules (name, shipping_type, calc_method, rate, min_charge, currency, is_default, status) VALUES
    ('ຂົນສົ່ງທາງບົກ (ຕໍ່ກິໂລ)', 'land', 'per_kg', 15000, 20000, 'LAK', 1, 'active'),
    ('ຂົນສົ່ງທາງອາກາດ (ຕໍ່ກິໂລ)', 'air', 'per_kg', 35000, 50000, 'LAK', 0, 'active'),
    ('ເຄື່ອງໃຫຍ່ (ຕໍ່ CBM)', 'land', 'per_cbm', 1800000, 100000, 'LAK', 0, 'active');

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
    ('company_name', 'ASB ບໍລິການຂົນສົ່ງ ແລະ ຮັບເຄື່ອງຈາກແອັບຈີນ'),
    ('company_phone', ''),
    ('company_address', ''),
    ('company_facebook', 'https://www.facebook.com/profile.php?id=61577617080184'),
    ('currency_cny_to_lak', '3200'),
    ('currency_thb_to_lak', '620'),
    ('tracking_prefix', 'ASB');

-- =====================================================================
-- MIGRATION — ສຳລັບຖານຂໍ້ມູນທີ່ສ້າງໄວ້ກ່ອນໜ້ານີ້ (ກ່ອນເພີ່ມຄຸນສົມບັດ photo_path)
-- MySQL 8.0.29+ ຮອງຮັບ "ADD COLUMN IF NOT EXISTS" ໂດຍກົງ —
-- ຖ້າ MySQL ເກົ່າກວ່ານີ້ ແລະ column ມີຢູ່ແລ້ວ ໃຫ້ລຶບແຖວນີ້ອອກກ່ອນແລ່ນ
-- =====================================================================
ALTER TABLE packages ADD COLUMN IF NOT EXISTS photo_path VARCHAR(255) NULL AFTER notes;
