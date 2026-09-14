/**
 * ໃຊ້ຄຳສັ່ງ `npm run seed` ຫຼັງ import schema.sql ແລ້ວ — ສ້າງ/ລີເຊັດຜູ້ໃຊ້ admin ເລີ່ມຕົ້ນ
 * ດ້ວຍລະຫັດຜ່ານທີ່ bcryptjs ຮັບປະກັນວ່າ compatible 100% (ບໍ່ພື່ງ hash ຈາກພາສາອື່ນ)
 */
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../db.js';

dotenv.config();

async function main() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const hash = bcrypt.hashSync(password, 10);

  const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (existing.length) {
    await pool.query('UPDATE users SET password_hash = ?, status = "active" WHERE username = ?', [hash, username]);
    console.log(`✅ ອັບເດດລະຫັດຜ່ານຂອງ '${username}' ແລ້ວ`);
  } else {
    await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role_key, status) VALUES (?,?,?,?,"active")',
      [username, hash, 'Administrator', 'admin']
    );
    console.log(`✅ ສ້າງຜູ້ໃຊ້ '${username}' ໃໝ່ແລ້ວ`);
  }
  console.log(`   username: ${username}`);
  console.log(`   password: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
