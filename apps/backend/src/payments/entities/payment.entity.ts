import { Payment as PrismaPayment, PaymentStatus, PaymentProvider } from '../../generated/prisma/client';

export class Payment {
      constructor(
            public readonly id: string,
            public readonly orderId: string,
            public readonly provider: PaymentProvider,
            public readonly transactionId: string,
            public readonly status: PaymentStatus,
            public readonly intentResponse: any,
            public readonly createdAt: Date,
            public readonly updatedAt: Date,
      ) {}

      static fromPrisma(data: PrismaPayment): Payment {
            return new Payment(
                  data.id,
                  data.orderId,
                  data.provider,
                  data.transactionId,
                  data.status,
                  data.intentResponse,
                  data.createdAt,
                  data.updatedAt,
            );
      }

      isPending(): boolean {
            return this.status === PaymentStatus.PENDING;
      }

      isSuccess(): boolean {
            return this.status === PaymentStatus.SUCCESS;
      }

      isFailed(): boolean {
            return this.status === PaymentStatus.FAILED;
      }

      toJSON(): any {
            return {
                  id: this.id,
                  orderId: this.orderId,
                  provider: this.provider,
                  transactionId: this.transactionId,
                  status: this.status,
                  // For now, let's keep it hidden for security/cleanliness unless needed.
                  createdAt: this.createdAt,
                  updatedAt: this.updatedAt,
            };
      }
}
