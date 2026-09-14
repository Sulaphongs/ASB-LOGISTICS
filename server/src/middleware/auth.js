import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'asb_token';
export const AUTH_COOKIE_NAME = COOKIE_NAME;

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role_key: user.role_key, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ success: false, error: 'ກະລຸນາເຂົ້າສູ່ລະບົບ' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'ເຊດຊັນໝົດອາຍຸ ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role_key !== 'admin') {
    return res.status(403).json({ success: false, error: 'ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນ' });
  }
  next();
}
