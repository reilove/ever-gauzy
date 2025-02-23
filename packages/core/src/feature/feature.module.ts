import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Feature } from './feature.entity';
import { FeatureOrganization } from './feature-organization.entity';
import { FeatureToggleController } from './feature-toggle.controller';
import { FeatureService } from './feature.service';
import { FeatureOrganizationService } from './feature-organization.service';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from './../user/user.module';
import { CommandHandlers } from './commands/handlers';

@Module({
	imports: [
		RouterModule.register([{ path: '/feature/toggle', module: FeatureModule }]),
		TypeOrmModule.forFeature([Feature, FeatureOrganization]),
		MikroOrmModule.forFeature([Feature, FeatureOrganization]),
		forwardRef(() => TenantModule),
		forwardRef(() => UserModule),
		CqrsModule
	],
	controllers: [FeatureToggleController],
	providers: [FeatureService, FeatureOrganizationService, ...CommandHandlers],
	exports: [TypeOrmModule, MikroOrmModule, FeatureService, FeatureOrganizationService]
})
export class FeatureModule { }
