import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Definitive bypass for preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No se proporcionó token' });
    }

    const token = authHeader.split(' ')[1];
    try {
      if (!token) throw new Error();
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      
      const isMaster = decoded.role === 'Gerente General' || decoded.role === 'Gerente Operaciones' || decoded.level === 1;
      
      if (roles.length > 0 && !roles.includes(decoded.role) && !isMaster) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      (req as any).user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
};
