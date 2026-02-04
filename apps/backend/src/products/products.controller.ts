import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ProductStatus } from '../generated/prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
      constructor(private readonly productsService: ProductsService) {}

      /**
       * Get all products (public endpoint)
       * Req 2.1.2: Users can view product lists
       */
      @Get()
      @ApiOperation({ summary: 'Get all products' })
      @ApiResponse({ status: 200, description: 'Return all products.' })
      @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
      async findAll(@Query('status') status?: ProductStatus) {
            const products = await this.productsService.findAll(status);
            return {
                  data: products.map((product) => product.toJSON()),
            };
      }

      /**
       * Get product by SKU (public endpoint)
       */
      @Get('sku/:sku')
      @ApiOperation({ summary: 'Get product by SKU' })
      @ApiResponse({ status: 200, description: 'Return product details.' })
      @ApiResponse({ status: 404, description: 'Product not found.' })
      async findBySku(@Param('sku') sku: string) {
            const product = await this.productsService.findBySku(sku);
            return {
                  data: product.toJSON(),
            };
      }

      /**
       * Get products by category (public endpoint)
       */
      @Get('category/:categoryId')
      @ApiOperation({ summary: 'Get products by category' })
      @ApiResponse({ status: 200, description: 'Return products in category.' })
      @ApiQuery({ name: 'status', required: false, enum: ProductStatus })
      async findByCategory(@Param('categoryId') categoryId: string, @Query('status') status?: ProductStatus) {
            const products = await this.productsService.findByCategoryId(categoryId, status);
            return {
                  data: products.map((product) => product.toJSON()),
            };
      }

      /**
       * Get product recommendations (public endpoint)
       * Req 2.2.5: Product Recommendations using DFS category traversal
       */
      @Get(':id/recommendations')
      @ApiOperation({
            summary: 'Get product recommendations',
            description: 'Get related products using DFS category tree traversal. Results are cached for 30 minutes.',
      })
      @ApiParam({ name: 'id', description: 'Product ID' })
      @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recommendations (default: 10)' })
      @ApiResponse({ status: 200, description: 'Return product recommendations.' })
      @ApiResponse({ status: 404, description: 'Product not found.' })
      async getRecommendations(@Param('id') id: string, @Query('limit') limit?: number) {
            const recommendations = await this.productsService.getRecommendations(id, limit ? parseInt(limit.toString(), 10) : 10);
            return {
                  data: recommendations.map((product) => product.toJSON()),
            };
      }

      /**
       * Get product by ID (public endpoint)
       * Req 2.1.2: Users can view product details
       */
      @Get(':id')
      @ApiOperation({ summary: 'Get product by ID' })
      @ApiResponse({ status: 200, description: 'Return product details.' })
      @ApiResponse({ status: 404, description: 'Product not found.' })
      async findOne(@Param('id') id: string) {
            const product = await this.productsService.findById(id);
            return {
                  data: product.toJSON(),
            };
      }

      /**
       * Create product (Admin only)
       * Req 2.1.2: Admin can create products
       */
      @Post()
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Create product (Admin only)' })
      @ApiResponse({ status: 201, description: 'Product created successfully.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      @HttpCode(HttpStatus.CREATED)
      async create(@Body() createProductDto: CreateProductDto) {
            const product = await this.productsService.create(createProductDto);
            return {
                  data: product.toJSON(),
            };
      }

      /**
       * Update product (Admin only)
       * Req 2.1.2: Admin can update products
       */
      @Patch(':id')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Update product (Admin only)' })
      @ApiResponse({ status: 200, description: 'Product updated successfully.' })
      @ApiResponse({ status: 404, description: 'Product not found.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
            const product = await this.productsService.update(id, updateProductDto);
            return {
                  data: product.toJSON(),
            };
      }

      /**
       * Delete product (Admin only)
       * Req 2.1.2: Admin can delete products
       */
      @Delete(':id')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Delete product (Admin only)' })
      @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
      @ApiResponse({ status: 404, description: 'Product not found.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      @HttpCode(HttpStatus.OK)
      async remove(@Param('id') id: string) {
            return await this.productsService.delete(id);
      }
}
