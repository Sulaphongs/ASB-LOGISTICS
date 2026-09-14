/**
 * ບັນທຶກກິດຈະກຳ — ASB Logistics (Node ຮຸ່ນ, ທຽບເທົ່າ classes/ActivityLogger.php ໃນ PHP ຮຸ່ນເກົ່າ)
 */
export async function logActivity(pool, { userId, username, actionType, module, description, oldData = null, newData = null, ip = null, userAgent = null }) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, username, action_type, module, description, old_data, new_data, ip_address, user_agent, created_at)
       VALUES (?,?,?,?,?,?,?,?,?, NOW())`,
      [
        userId ?? null,
        username ?? null,
        actionType,
        module,
        description,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ip,
        userAgent,
      ]
    );
  } catch (err) {
    console.error('activityLogger error:', err.message);
  }
}
