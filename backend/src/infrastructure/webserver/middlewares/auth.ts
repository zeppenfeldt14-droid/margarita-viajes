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
      
      const userLevel = Number(decoded.level || 3);
      const isMaster = userLevel === 1 || decoded.role === 'Gerente General' || decoded.role === 'Gerente Operaciones';
      
      // Determine required level from roles array (e.g., ['LEVEL_1', 'LEVEL_2', 'LEVEL_3'])
      // Check for the least restrictive level (highest number) first to permit access
      let requiredLevel = 0; 
      if (roles.includes('LEVEL_3')) requiredLevel = 3;
      else if (roles.includes('LEVEL_2')) requiredLevel = 2;
      else if (roles.includes('LEVEL_1')) requiredLevel = 1;

      // Access granted if user is Master (Level 1) or has the specific role, or meets the level requirement
      const hasAccess = isMaster || roles.includes(decoded.role) || userLevel <= requiredLevel;

      if (roles.length > 0 && !hasAccess) {
        return res.status(403).json({ error: 'Acceso denegado (Nivel insuficiente)' });
      }

      (req as any).user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
};
