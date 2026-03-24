import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export class AuthController {
  constructor(private userRepo: IUserRepository) {}

  async login(req: Request, res: Response) {
    const { email, username, password } = req.body;
    const identity = email || username;

    if (!identity) {
      return res.status(400).json({ error: 'Se requiere email o nombre de usuario' });
    }



    try {
      const user = await this.userRepo.findByIdentity(identity);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }


      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.fullName, level: user.level }, 
        process.env.JWT_SECRET || 'secret_key', 
        { expiresIn: '8h' }
      );

      return res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.fullName, 
          role: user.role, 
          email: user.email,
          level: user.level,
          modules: user.modules,
          alias: user.alias
        } 
      });
    } catch (error: any) {
      console.error('[Auth] Error en login:', error);
      return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  async checkToken(req: Request, res: Response) {
    // El middleware de autenticación ya verificó el token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      return res.json({ valid: true, user: decoded });
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
}
