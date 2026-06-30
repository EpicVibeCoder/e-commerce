import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "src/generated/prisma/enums";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { UpdateCategoryDto } from "./dto/update-category.dto.js";

@ApiTags("categories")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller("categories")
export class CategoriesController {
      constructor(private readonly categoriesService: CategoriesService) {}

      @Get()
      @ApiOperation({ summary: "List all categories (admin)" })
      findAll() {
            return this.categoriesService.findAll();
      }

      @Get(":id")
      @ApiOperation({ summary: "Get a category by id (admin)" })
      findOne(@Param("id") id: string) {
            return this.categoriesService.findOne(id);
      }

      @Post()
      @ApiOperation({ summary: "Create a category (admin)" })
      create(@Body() dto: CreateCategoryDto) {
            return this.categoriesService.create(dto);
      }

      @Patch(":id")
      @ApiOperation({ summary: "Update a category (admin)" })
      update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
            return this.categoriesService.update(id, dto);
      }

      @Delete(":id")
      @ApiOperation({ summary: "Delete a category (admin)" })
      remove(@Param("id") id: string) {
            return this.categoriesService.remove(id);
      }
}
