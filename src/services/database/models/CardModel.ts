import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class CardModel extends Model {
  static table = 'cards';

  @field('user_id') userId!: string;
  @field('card_name') cardName!: string;
  @field('created_at') createdAt!: number;
}
