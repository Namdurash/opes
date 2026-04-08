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
  @field('sort_order') sortOrder!: number;
  @field('monobank_account_id') monobankAccountId!: string | null;
  @field('currency_code') currencyCode!: number | null;
  @field('currency_symbol') currencySymbol!: string | null;
  @field('iban') iban!: string | null;
  @field('masked_pan') maskedPan!: string | null;
  @field('credit_limit') creditLimit!: number | null;
  @field('monobank_balance') monobankBalance!: number | null;
}
