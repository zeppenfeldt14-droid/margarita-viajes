export interface User {
  id?: string;
  email: string;
  passwordHash: string;
  role: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  fullName: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
}
