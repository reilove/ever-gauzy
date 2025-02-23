import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { RouterModule } from '@nestjs/core';
import { ApprovalPolicy } from './approval-policy.entity';
import { ApprovalPolicyController } from './approval-policy.controller';
import { ApprovalPolicyService } from './approval-policy.service';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from '../user/user.module';
import { CommandHandlers } from './commands/handlers';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
	imports: [
		RouterModule.register([{ path: '/approval-policy', module: ApprovalPolicyModule }]),
		TypeOrmModule.forFeature([ApprovalPolicy]),
		MikroOrmModule.forFeature([ApprovalPolicy]),
		TenantModule,
		UserModule,
		CqrsModule
	],
	controllers: [ApprovalPolicyController],
	providers: [ApprovalPolicyService, ...CommandHandlers],
	exports: [ApprovalPolicyService]
})
export class ApprovalPolicyModule { }
