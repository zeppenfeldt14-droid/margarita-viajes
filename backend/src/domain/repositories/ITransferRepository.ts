export interface Transfer {
  id?: string;
  route: string;
  operator: string;
  netCost: number;
  salePrice: number;
}

export interface ITransferRepository {
  findAll(): Promise<Transfer[]>;
  create(transfer: Transfer): Promise<Transfer>;
  update(id: string, transfer: Partial<Transfer>): Promise<Transfer>;
  delete(id: string): Promise<void>;
}
