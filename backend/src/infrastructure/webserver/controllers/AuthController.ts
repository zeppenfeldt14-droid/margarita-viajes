import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export class AuthController {
  constructor(private userRepo: IUserRepository) {}

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const user = await this.userRepo.findByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env['JWT_SECRET'] || 'secret_key',
        { expiresIn: '8h' }
      );

      return res.json({ token, user: { username: user.username, role: user.role, fullName: user.fullName } });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
