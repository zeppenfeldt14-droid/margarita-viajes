import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (roles?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    try {
      const decoded: any = jwt.verify(token, process.env['JWT_SECRET'] || 'secret_key');
      (req as any).user = decoded;

      if (roles && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
