import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PaymentProvider, PaymentStatus } from "src/generated/prisma/enums";
import { PAYMENT_STRATEGIES, type PaymentStrategy } from "./strategies/payment-strategy.interface";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
      let service: PaymentsService;

      const stripeStrategy: PaymentStrategy = {
            provider: PaymentProvider.stripe,
            initiate: vi.fn().mockResolvedValue({
                  provider: PaymentProvider.stripe,
                  transactionId: "txn_1",
                  clientSecret: "secret",
            }),
            handleWebhook: vi.fn().mockResolvedValue({
                  provider: PaymentProvider.stripe,
                  transactionId: "txn_1",
                  orderId: "ord_1",
                  status: PaymentStatus.succeeded,
            }),
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [PaymentsService, { provide: PAYMENT_STRATEGIES, useValue: [stripeStrategy] }],
            }).compile();

            service = module.get(PaymentsService);
            vi.clearAllMocks();
      });

      it("should be defined", () => {
            expect(service).toBeDefined();
      });

      it("delegates initiate to the matching strategy", async () => {
            await service.initiate(
                  PaymentProvider.stripe,
                  {
                        id: "ord_1",
                        userId: "user_1",
                        totalAmount: "10.00",
                        status: "pending",
                  },
                  { successUrl: "https://ok", cancelUrl: "https://cancel" },
            );

            expect(stripeStrategy.initiate).toHaveBeenCalledOnce();
      });

      it("rejects unsupported providers", async () => {
            await expect(
                  service.initiate(
                        PaymentProvider.sslcommerz,
                        {
                              id: "ord_1",
                              userId: "user_1",
                              totalAmount: "10.00",
                              status: "pending",
                        },
                        { successUrl: "https://ok", cancelUrl: "https://cancel" },
                  ),
            ).rejects.toBeInstanceOf(BadRequestException);
      });
});
