import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthedRequest extends Request {
  staffId?: string;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ error: { code: 'UNAUTHENTICATED', message: 'Login required.' } });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { staffId: string };
    req.staffId = payload.staffId;
    next();
  } catch {
    return res
      .status(401)
      .json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Session invalid or expired.',
        },
      });
  }
}
