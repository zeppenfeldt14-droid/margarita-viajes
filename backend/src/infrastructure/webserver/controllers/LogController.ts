import type { Request, Response } from 'express';
import type { ILogRepository } from '../../../domain/repositories/ILogRepository.js';

export class LogController {
  constructor(private logRepo: ILogRepository) {}

  async getLogs(req: Request, res: Response) {
    try {
      const logs = await this.logRepo.findAll();
      return res.json(logs);
    } catch (error: any) {
      console.error('[LogController] Error en getLogs:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  async createLog(req: Request, res: Response) {
    try {
      const { user_id, user_name, action_type, details } = req.body;
      const log = await this.logRepo.create({
        user_id,
        user_name,
        action_type,
        details
      });
      return res.status(201).json(log);
    } catch (error: any) {
      console.error('[LogController] Error en createLog:', error);
      return res.status(500).json({ message: error.message });
    }
  }
}
