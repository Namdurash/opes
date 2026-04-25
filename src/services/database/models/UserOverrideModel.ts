import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class UserOverrideModel extends Model {
  static table = 'user_overrides';

  @field('transaction_id') transactionId!: string;
  @field('category_id') categoryId!: string;
  @field('created_at') createdAt!: number;
}
