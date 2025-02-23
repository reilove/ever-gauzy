import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { GoalKpiController } from './goal-kpi.controller';
import { GoalKpiService } from './goal-kpi.service';
import { GoalKPI } from './goal-kpi.entity';
import { TenantModule } from '../tenant/tenant.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
	imports: [
		RouterModule.register([{ path: '/goal-kpi', module: GoalKpiModule }]),
		TypeOrmModule.forFeature([GoalKPI]),
		MikroOrmModule.forFeature([GoalKPI]),
		TenantModule
	],
	controllers: [GoalKpiController],
	providers: [GoalKpiService],
	exports: [GoalKpiService]
})
export class GoalKpiModule { }
