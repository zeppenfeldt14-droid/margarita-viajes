import { Knex } from 'knex';
import { ITransferRepository, Transfer } from '../../domain/repositories/ITransferRepository.js';

export class PostgresTransferRepository implements ITransferRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Transfer[]> {
    const results = await this.db('transfers').select('*');
    return results.map(row => ({
      ...row,
      netCost: row.net_cost,
      salePrice: row.sale_price
    }));
  }

  async create(transfer: Transfer): Promise<Transfer> {
    const [result] = await this.db('transfers').insert({
      route: transfer.route,
      operator: transfer.operator,
      net_cost: transfer.netCost,
      sale_price: transfer.salePrice
    }).returning('*');
    
    return {
      ...result,
      netCost: result.net_cost,
      salePrice: result.sale_price
    };
  }

  async update(id: string, transfer: Partial<Transfer>): Promise<Transfer> {
    const updateData: any = {};
    if (transfer.route) updateData.route = transfer.route;
    if (transfer.operator) updateData.operator = transfer.operator;
    if (transfer.netCost !== undefined) updateData.net_cost = transfer.netCost;
    if (transfer.salePrice !== undefined) updateData.sale_price = transfer.salePrice;

    const [result] = await this.db('transfers')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return {
      ...result,
      netCost: result.net_cost,
      salePrice: result.sale_price
    };
  }

  async delete(id: string): Promise<void> {
    await this.db('transfers').where('id', id).del();
  }
}
