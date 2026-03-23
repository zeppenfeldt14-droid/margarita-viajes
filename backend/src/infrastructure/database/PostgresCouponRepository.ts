import type Knex from 'knex';
import type { ICouponRepository, Coupon } from '../../domain/repositories/ICouponRepository.js';

export class PostgresCouponRepository implements ICouponRepository {
  constructor(private db: Knex.Knex) {}

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
}
