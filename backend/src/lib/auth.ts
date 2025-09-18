import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export type JwtPayload = { userId: string; role: string };

export function signJwt(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}