import { Q } from '@nozbe/watermelondb';
import { User } from '../../domain/auth';
import { database } from '../../services/database';
import { UserModel } from '../../services/database/models';

export interface CreateUserInput {
  name: string;
  passwordHash: string;
}

export interface UsersRepositoryContract {
  create(input: CreateUserInput): Promise<User>;
  hasAnyUser(): Promise<boolean>;
  findById(id: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
}

const toDomain = (model: UserModel): User => ({
  id: model.id,
  name: model.name,
  passwordHash: model.passwordHash,
  createdAt: model.createdAt,
});

export class UsersRepository implements UsersRepositoryContract {
  async create(input: CreateUserInput): Promise<User> {
    const collection = database.get<UserModel>('users');
    const createdAt = Date.now();

    const user = await database.write(async () => {
      return collection.create(record => {
        record.name = input.name;
        record.passwordHash = input.passwordHash;
        record.createdAt = createdAt;
      });
    });

    return toDomain(user);
  }

  async hasAnyUser(): Promise<boolean> {
    const usersCollection = database.get<UserModel>('users');
    const users = await usersCollection.query(Q.take(1)).fetch();

    return users.length > 0;
  }

  async findById(id: string): Promise<User | null> {
    const usersCollection = database.get<UserModel>('users');

    try {
      const user = await usersCollection.find(id);
      return toDomain(user);
    } catch {
      return null;
    }
  }

  async findByName(name: string): Promise<User | null> {
    const usersCollection = database.get<UserModel>('users');
    const users = await usersCollection.query(Q.where('name', name), Q.take(1)).fetch();

    return users.length > 0 ? toDomain(users[0]) : null;
  }
}
