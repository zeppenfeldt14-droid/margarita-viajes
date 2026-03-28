export interface Coupon {
  id?: string;
  code: string;
  discount: number;
  expiry: string;
  active: boolean;
  times_used?: number;   // B.4b: contador de usos
  created_at?: string;
}

export interface ICouponRepository {
  findAll(): Promise<Coupon[]>;
  create(coupon: Coupon): Promise<Coupon>;
  update(id: string, coupon: Partial<Coupon>): Promise<void>;
  delete(id: string): Promise<void>;
  incrementByCode(code: string): Promise<void>;  // B.4b: incrementar contador
}
