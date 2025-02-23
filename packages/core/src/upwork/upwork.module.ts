import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UpworkJobService, UpworkOffersService, UpworkReportService } from '@gauzy/integration-upwork';
import { TenantModule } from './../tenant/tenant.module';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationVendorModule } from 'organization-vendor/organization-vendor.module';
import { ExpenseCategoriesModule } from '../expense-categories/expense-categories.module';
import { UpworkTransactionService } from './upwork-transaction.service';
import { EmployeeModule } from '../employee/employee.module';
import { OrganizationContactModule } from './../organization-contact/organization-contact.module';
import { IntegrationMapModule } from './../integration-map/integration-map.module';
import { TimeSlotService } from '../time-tracking/time-slot/time-slot.service';
import { ExpenseModule } from './../expense/expense.module';
import { IncomeModule } from './../income/income.module';
import { Activity, TimeLog, TimeSlot, TimeSlotMinute } from './../core/entities/internal';
import { UpworkController } from './upwork.controller';
import { UpworkService } from './upwork.service';
import { UpworkAuthorizationController } from './upwork-authorization.controller';

const entities = [
	TimeSlot,
	Activity,
	TimeLog,
	TimeSlotMinute
];

@Module({
	imports: [
		RouterModule.register([{ path: '/integrations/upwork', module: UpworkModule }]),
		TypeOrmModule.forFeature(entities),
		MikroOrmModule.forFeature(entities),
		TenantModule,
		UserModule,
		EmployeeModule,
		RoleModule,
		OrganizationModule,
		OrganizationVendorModule,
		OrganizationContactModule,
		IntegrationMapModule,
		IncomeModule,
		ExpenseModule,
		ExpenseCategoriesModule,
		CqrsModule
	],
	controllers: [UpworkAuthorizationController, UpworkController],
	providers: [
		UpworkJobService,
		UpworkOffersService,
		UpworkTransactionService,
		UpworkReportService,
		UpworkService,
		TimeSlotService
	]
})
export class UpworkModule { }
