import { PaymentProvider, PaymentStatus } from '../generated/prisma/enums.js';
import { DomainError } from './domain-error.js';
import type { PaymentPersistence } from './types.js';

const VALID_PROVIDERS = new Set<string>(Object.values(PaymentProvider));
const VALID_STATUSES = new Set<string>(Object.values(PaymentStatus));

const TERMINAL_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.failed,
  PaymentStatus.cancelled,
  PaymentStatus.refunded,
]);

const ALLOWED_TRANSITIONS: ReadonlyMap<
  PaymentStatus,
  ReadonlySet<PaymentStatus>
> = new Map([
  [
    PaymentStatus.pending,
    new Set([
      PaymentStatus.succeeded,
      PaymentStatus.failed,
      PaymentStatus.cancelled,
    ]),
  ],
  [PaymentStatus.succeeded, new Set([PaymentStatus.refunded])],
  [PaymentStatus.failed, new Set()],
  [PaymentStatus.cancelled, new Set()],
  [PaymentStatus.refunded, new Set()],
]);

export class Payment {
  readonly id: string;
  readonly orderId: string;
  readonly provider: PaymentProvider;
  readonly transactionId: string;
  readonly status: PaymentStatus;

  constructor(props: {
    id: string;
    orderId: string;
    provider: PaymentProvider;
    transactionId: string;
    status: PaymentStatus;
  }) {
    if (!props.orderId.trim()) {
      throw new DomainError('Payment orderId is required');
    }
    if (!props.transactionId.trim()) {
      throw new DomainError('Payment transactionId is required');
    }
    if (!VALID_PROVIDERS.has(props.provider)) {
      throw new DomainError(`Invalid payment provider: ${props.provider}`);
    }
    if (!VALID_STATUSES.has(props.status)) {
      throw new DomainError(`Invalid payment status: ${props.status}`);
    }

    this.id = props.id;
    this.orderId = props.orderId;
    this.provider = props.provider;
    this.transactionId = props.transactionId.trim();
    this.status = props.status;
  }

  static fromPersistence(data: PaymentPersistence): Payment {
    return new Payment(data);
  }

  isSuccessful(): boolean {
    return this.status === PaymentStatus.succeeded;
  }

  canTransitionTo(next: PaymentStatus): boolean {
    if (this.status === next) {
      return true;
    }
    if (TERMINAL_STATUSES.has(this.status)) {
      return false;
    }
    return ALLOWED_TRANSITIONS.get(this.status)?.has(next) ?? false;
  }

  transitionTo(next: PaymentStatus): Payment {
    if (!this.canTransitionTo(next)) {
      throw new DomainError(
        `Cannot transition payment from ${this.status} to ${next}`,
      );
    }
    return new Payment({
      id: this.id,
      orderId: this.orderId,
      provider: this.provider,
      transactionId: this.transactionId,
      status: next,
    });
  }
}
