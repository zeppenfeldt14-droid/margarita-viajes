import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export class AuthController {
  constructor(private userRepo: IUserRepository) {}

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.fullName }, 
        process.env.JWT_SECRET || 'secret_key', 
        { expiresIn: '8h' }
      );

      return res.json({ token, user: { id: user.id, name: user.fullName, role: user.role, email: user.email } });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
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
创新管理
