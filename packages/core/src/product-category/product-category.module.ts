import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductCategory } from './product-category.entity';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';
import { ProductCategoryTranslation } from './product-category-translation.entity';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from './../user/user.module';
import { CommandHandlers } from './commands/handlers';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
	imports: [
		RouterModule.register([{ path: '/product-categories', module: ProductCategoryModule }]),
		TypeOrmModule.forFeature([ProductCategory, ProductCategoryTranslation]),
		MikroOrmModule.forFeature([ProductCategory, ProductCategoryTranslation]),
		TenantModule,
		UserModule,
		CqrsModule
	],
	controllers: [ProductCategoryController],
	providers: [ProductCategoryService, ...CommandHandlers],
	exports: [TypeOrmModule, MikroOrmModule, ProductCategoryService]
})
export class ProductCategoryModule { }
