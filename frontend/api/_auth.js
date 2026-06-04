import jwt from 'jsonwebtoken';

export function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
  try {
    const user = jwt.verify(token, jwtSecret);
    return user; // { userId, companyId, role, iat, exp }
  } catch (error) {
    throw new Error('Forbidden: Invalid token');
  }
}

export function requireRole(user, ...roles) {
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden: Anda tidak memiliki akses ke fitur ini');
  }
}
