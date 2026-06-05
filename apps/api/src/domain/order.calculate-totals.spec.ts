import { DomainError } from './domain-error.js';
import { Order } from './order.js';

describe('Order.calculateTotals', () => {
  it('sums line subtotals into totalAmount', () => {
    const result = Order.calculateTotals([
      { productId: 'p1', quantity: 2, unitPrice: '10.00' },
      { productId: 'p2', quantity: 1, unitPrice: '25.50' },
    ]);

    expect(result.items).toEqual([
      { productId: 'p1', quantity: 2, price: '10.00', subtotal: '20.00' },
      { productId: 'p2', quantity: 1, price: '25.50', subtotal: '25.50' },
    ]);
    expect(result.totalAmount).toBe('45.50');
  });

  it('accepts numeric unit prices and normalizes to two decimals', () => {
    const result = Order.calculateTotals([
      { productId: 'p1', quantity: 3, unitPrice: 9.99 },
    ]);

    expect(result.items[0]).toEqual({
      productId: 'p1',
      quantity: 3,
      price: '9.99',
      subtotal: '29.97',
    });
    expect(result.totalAmount).toBe('29.97');
  });

  it('rejects empty line list', () => {
    expect(() => Order.calculateTotals([])).toThrow(DomainError);
    expect(() => Order.calculateTotals([])).toThrow(
      'Order must contain at least one line item',
    );
  });

  it('rejects invalid quantity', () => {
    expect(() =>
      Order.calculateTotals([
        { productId: 'p1', quantity: 0, unitPrice: '10.00' },
      ]),
    ).toThrow(DomainError);
  });

  it('rejects non-positive unit price', () => {
    expect(() =>
      Order.calculateTotals([
        { productId: 'p1', quantity: 1, unitPrice: '0.00' },
      ]),
    ).toThrow(DomainError);
  });
});
