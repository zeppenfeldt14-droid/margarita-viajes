import knex from 'knex';
type Knex = any;
import type { ITransferRepository, Transfer } from '../../domain/repositories/ITransferRepository.js';
import crypto from 'crypto';

export class PostgresTransferRepository implements ITransferRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Transfer[]> {
    const results = await this.db('transfers').select('*');
    return results.map((row: any) => ({
      ...row,
      netCost: row.net_cost,
      salePrice: row.sale_price,
      email: row.email,
      whatsapp: row.whatsapp
    }));
  }

  async create(transfer: Transfer): Promise<Transfer> {
    const id = transfer.id || crypto.randomUUID();
    const [result] = await this.db('transfers').insert({
      id: id,
      route: transfer.route,
      operator: transfer.operator,
      email: transfer.email,
      whatsapp: transfer.whatsapp,
      net_cost: transfer.netCost,
      sale_price: transfer.salePrice
    }).returning('*');
    
    return {
      ...result,
      netCost: result.net_cost,
      salePrice: result.sale_price,
      email: result.email,
      whatsapp: result.whatsapp
    };
  }

  async update(id: string, transfer: Partial<Transfer>): Promise<Transfer> {
    const updateData: any = {};
    if (transfer.route) updateData.route = transfer.route;
    if (transfer.operator) updateData.operator = transfer.operator;
    if (transfer.email !== undefined) updateData.email = transfer.email;
    if (transfer.whatsapp !== undefined) updateData.whatsapp = transfer.whatsapp;
    if (transfer.netCost !== undefined) updateData.net_cost = transfer.netCost;
    if (transfer.salePrice !== undefined) updateData.sale_price = transfer.salePrice;

    const [result] = await this.db('transfers')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return {
      ...result,
      netCost: result.net_cost,
      salePrice: result.sale_price,
      email: result.email,
      whatsapp: result.whatsapp
    };
  }

  async delete(id: string): Promise<void> {
    await this.db('transfers').where('id', id).del();
  }
}
