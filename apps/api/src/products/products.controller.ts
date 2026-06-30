import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "src/generated/prisma/enums";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { UpdateProductDto } from "./dto/update-product.dto.js";
import { ListProductsQueryDto } from "./dto/list-products.dto.js";

@ApiTags("products")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller("products")
export class ProductsController {
      constructor(private readonly productsService: ProductsService) {}

      @Get()
      @ApiOperation({ summary: "List all products (admin)" })
      findAll(@Query() query: ListProductsQueryDto) {
            return this.productsService.findAll(query);
      }

      @Get(":id")
      @ApiOperation({ summary: "Get a product by id (admin)" })
      findOne(@Param("id") id: string) {
            return this.productsService.findOne(id);
      }

      @Post()
      @ApiOperation({ summary: "Create a product (admin)" })
      create(@Body() dto: CreateProductDto) {
            return this.productsService.create(dto);
      }

      @Patch(":id")
      @ApiOperation({ summary: "Update a product (admin)" })
      update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
            return this.productsService.update(id, dto);
      }

      @Delete(":id")
      @ApiOperation({ summary: "Delete a product (admin)" })
      remove(@Param("id") id: string) {
            return this.productsService.remove(id);
      }
}
