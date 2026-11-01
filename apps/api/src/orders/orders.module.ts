import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { AuthModule } from "src/auth/auth.module";

@Module({
      imports: [AuthModule],
      controllers: [OrdersController],
      providers: [OrdersService],
})
export class OrdersModule {}
