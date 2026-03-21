export interface User {
  id?: string;
  username: string;
  passwordHash: string;
  role: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  fullName: string;
}

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  create(user: User): Promise<User>;
}
