import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class MerchantRuleModel extends Model {
  static table = 'merchant_rules';

  @field('merchant_name') merchantName!: string;
  @field('category_id') categoryId!: string;
  @field('created_at') createdAt!: number;
}
