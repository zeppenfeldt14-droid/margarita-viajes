import knex from 'knex';
type Knex = any;
import type { ICouponRepository, Coupon } from '../../domain/repositories/ICouponRepository.js';

export class PostgresCouponRepository implements ICouponRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Coupon[]> {
    return await this.db('coupons').select('*');
  }

  async create(coupon: Coupon): Promise<any> {
    const [result] = await this.db('coupons').insert({
      code: coupon.code,
      discount: coupon.discount,
      expiry: coupon.expiry,
      active: coupon.active
    }).returning('*');
    return result;
  }

  async update(id: string, coupon: Partial<Coupon>): Promise<void> {
    await this.db('coupons').where('id', id).update(coupon);
  }

  async delete(id: string): Promise<void> {
    await this.db('coupons').where('id', id).del();
  }

  // B.4b: Incrementar el contador de usos por código
  async incrementByCode(code: string): Promise<void> {
    await this.db('coupons')
      .where('code', code.toUpperCase())
      .increment('times_used', 1);
  }
}
