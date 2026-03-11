import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class UserModel extends Model {
  static table = 'users';

  @field('name') name!: string;
  @field('password_hash') passwordHash!: string;
  @field('created_at') createdAt!: number;
}
