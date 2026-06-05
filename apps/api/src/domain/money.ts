import { DomainError } from './domain-error.js';

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function parseMoney(value: string | number): string {
  const raw = typeof value === 'number' ? value.toFixed(2) : value.trim();
  if (!MONEY_PATTERN.test(raw)) {
    throw new DomainError(`Invalid monetary amount: ${value}`);
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new DomainError(`Invalid monetary amount: ${value}`);
  }
  return n.toFixed(2);
}

export function multiplyMoney(unitPrice: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new DomainError(
      `Quantity must be a positive integer, got ${quantity}`,
    );
  }
  return (Number(unitPrice) * quantity).toFixed(2);
}

export function sumMoney(amounts: string[]): string {
  return amounts.reduce((sum, a) => sum + Number(a), 0).toFixed(2);
}
