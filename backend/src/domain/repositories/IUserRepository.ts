export interface User {
  id?: string;
  email: string;
  alias?: string;
  passwordHash: string;
  role: string;
  fullName: string;
  dailyQuota?: number;
  active?: boolean;
  level?: number;
  photo?: string;
  inRoulette?: boolean;
  modules?: any;
  connectionLogs?: any[];
  actionLogs?: any[];
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByIdentity(identity: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
