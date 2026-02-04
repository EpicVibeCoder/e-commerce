import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/client';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
      constructor(private readonly categoriesService: CategoriesService) {}

      /**
       * Get all categories as hierarchy (public endpoint)
       */
      @Get()
      @ApiOperation({ summary: 'Get all categories as hierarchy' })
      @ApiResponse({ status: 200, description: 'Return all categories.' })
      async findAll() {
            const categories = await this.categoriesService.findAll();
            return {
                  data: categories.map((cat) => cat.toJSON()),
            };
      }

      /**
       * Get single category by ID (public endpoint)
       */
      @Get(':id')
      @ApiOperation({ summary: 'Get category by ID' })
      @ApiResponse({ status: 200, description: 'Return category details.' })
      @ApiResponse({ status: 404, description: 'Category not found.' })
      async findOne(@Param('id') id: string) {
            const category = await this.categoriesService.findById(id);
            return {
                  data: category.toJSON(),
            };
      }

      /**
       * Create category (Admin only)
       */
      @Post()
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Create category (Admin only)' })
      @ApiResponse({ status: 201, description: 'Category created successfully.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      @HttpCode(HttpStatus.CREATED)
      async create(@Body() createCategoryDto: CreateCategoryDto) {
            const category = await this.categoriesService.create(createCategoryDto);
            return {
                  data: category.toJSON(),
            };
      }

      /**
       * Update category (Admin only)
       */
      @Patch(':id')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Update category (Admin only)' })
      @ApiResponse({ status: 200, description: 'Category updated successfully.' })
      @ApiResponse({ status: 404, description: 'Category not found.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
            const category = await this.categoriesService.update(id, updateCategoryDto);
            return {
                  data: category.toJSON(),
            };
      }

      /**
       * Delete category (Admin only)
       */
      @Delete(':id')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Delete category (Admin only)' })
      @ApiResponse({ status: 204, description: 'Category deleted successfully.' })
      @ApiResponse({ status: 404, description: 'Category not found.' })
      @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
      @HttpCode(HttpStatus.NO_CONTENT)
      async remove(@Param('id') id: string) {
            await this.categoriesService.delete(id);
      }
}
