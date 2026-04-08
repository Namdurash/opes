import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class TransactionModel extends Model {
  static table = 'transactions';

  @field('title') title!: string;
  @field('amount') amount!: number;
  @field('type') type!: string;
  @field('occurred_at_iso') occurredAtIso!: string;
  @field('card_id') cardId!: string;
  @field('mcc') mcc!: number;
  @field('currency_code') currencyCode!: number;
  @field('currency_symbol') currencySymbol!: string;
  @field('balance') balance!: number;
  @field('hold') hold!: boolean;
  @field('comment') comment!: string | null;
}
