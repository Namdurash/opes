import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class CardModel extends Model {
  static table = 'cards';

  @field('user_id') userId!: string;
  @field('card_name') legacyCardName!: string;
  @field('title') title!: string;
  @field('money_amount') moneyAmount!: number;
  @field('type') type!: string;
  @field('image') image!: string | null;
  @field('created_at') createdAt!: number;
}
