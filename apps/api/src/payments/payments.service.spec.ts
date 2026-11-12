import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { OrderStatus, PaymentProvider, PaymentStatus } from "src/generated/prisma/enums";
import { PrismaService } from "src/prisma/prisma.service";
import { PAYMENT_STRATEGIES, type PaymentStrategy } from "./strategies/payment-strategy.interface";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
      let service: PaymentsService;

      const stripeStrategy: PaymentStrategy = {
            provider: PaymentProvider.stripe,
            initiate: vi.fn(),
            handleWebhook: vi.fn(),
      };

      const dto = {
            orderId: "ord_1",
            provider: PaymentProvider.stripe,
            successUrl: "https://ok",
            cancelUrl: "https://cancel",
            customerEmail: "demo@customer.com",
      };

      const pendingOrder = {
            id: "ord_1",
            userId: "user_1",
            totalAmount: { toString: () => "10.00" },
            status: OrderStatus.pending,
            payments: [] as { status: PaymentStatus }[],
      };

      const prisma = {
            order: {
                  findUnique: vi.fn(),
            },
            payment: {
                  create: vi.fn(),
            },
      };

      beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                  providers: [PaymentsService, { provide: PAYMENT_STRATEGIES, useValue: [stripeStrategy] }, { provide: PrismaService, useValue: prisma }],
            }).compile();

            service = module.get(PaymentsService);

            vi.clearAllMocks();
            pendingOrder.payments = [];
            prisma.order.findUnique.mockResolvedValue(pendingOrder);
            prisma.payment.create.mockResolvedValue({ id: "pay_1" });
            (stripeStrategy.initiate as ReturnType<typeof vi.fn>).mockResolvedValue({
                  provider: PaymentProvider.stripe,
                  transactionId: "txn_1",
                  clientSecret: "secret",
            });
            (stripeStrategy.handleWebhook as ReturnType<typeof vi.fn>).mockResolvedValue({
                  provider: PaymentProvider.stripe,
                  transactionId: "txn_1",
                  orderId: "ord_1",
                  status: PaymentStatus.succeeded,
            });
      });

      it("should be defined", () => {
            expect(service).toBeDefined();
      });

      it("checkouts a pending order and creates a payment", async () => {
            const result = await service.checkout("user_1", dto);

            expect(prisma.order.findUnique).toHaveBeenCalledWith({
                  where: { id: "ord_1" },
                  include: { payments: true },
            });
            expect(stripeStrategy.initiate).toHaveBeenCalledWith(
                  {
                        id: "ord_1",
                        userId: "user_1",
                        totalAmount: "10.00",
                        status: OrderStatus.pending,
                  },
                  {
                        successUrl: "https://ok",
                        cancelUrl: "https://cancel",
                        customerEmail: "demo@customer.com",
                  },
            );
            expect(prisma.payment.create).toHaveBeenCalledWith({
                  data: {
                        orderId: "ord_1",
                        provider: PaymentProvider.stripe,
                        transactionId: "txn_1",
                        status: PaymentStatus.pending,
                  },
            });
            expect(result).toEqual({
                  paymentId: "pay_1",
                  orderId: "ord_1",
                  provider: PaymentProvider.stripe,
                  transactionId: "txn_1",
                  clientSecret: "secret",
            });
      });

      it("throws NotFoundException when order is missing", async () => {
            prisma.order.findUnique.mockResolvedValue(null);

            await expect(service.checkout("user_1", dto)).rejects.toBeInstanceOf(NotFoundException);
            expect(stripeStrategy.initiate).not.toHaveBeenCalled();
            expect(prisma.payment.create).not.toHaveBeenCalled();
      });

      it("throws ForbiddenException when order belongs to another user", async () => {
            prisma.order.findUnique.mockResolvedValue({ ...pendingOrder, userId: "other_user" });

            await expect(service.checkout("user_1", dto)).rejects.toBeInstanceOf(ForbiddenException);
            expect(stripeStrategy.initiate).not.toHaveBeenCalled();
      });

      it("rejects checkout when order is not pending", async () => {
            prisma.order.findUnique.mockResolvedValue({
                  ...pendingOrder,
                  status: OrderStatus.cancelled,
            });

            await expect(service.checkout("user_1", dto)).rejects.toBeInstanceOf(BadRequestException);
            expect(stripeStrategy.initiate).not.toHaveBeenCalled();
      });

      it("rejects checkout when a pending payment already exists", async () => {
            prisma.order.findUnique.mockResolvedValue({
                  ...pendingOrder,
                  payments: [{ status: PaymentStatus.pending }],
            });

            await expect(service.checkout("user_1", dto)).rejects.toBeInstanceOf(BadRequestException);
            expect(stripeStrategy.initiate).not.toHaveBeenCalled();
            expect(prisma.payment.create).not.toHaveBeenCalled();
      });

      it("rejects unsupported providers", async () => {
            await expect(service.checkout("user_1", { ...dto, provider: PaymentProvider.sslcommerz })).rejects.toBeInstanceOf(BadRequestException);
            expect(prisma.payment.create).not.toHaveBeenCalled();
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
});
