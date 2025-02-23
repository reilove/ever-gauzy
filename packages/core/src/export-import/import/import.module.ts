import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConfig } from '@gauzy/config';
import { getEntitiesFromPlugins } from '@gauzy/plugin';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { coreEntities } from '../../core/entities';
import { CommandHandlers } from './commands/handlers';
import { ImportRecordModule } from '../import-record';
import { ImportHistoryModule } from '../import-history';
import { TenantModule } from '../../tenant/tenant.module';
import { UserModule } from '../../user/user.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
	imports: [
		RouterModule.register([
			{
				path: '/import',
				module: ImportModule,
				children: [{ path: '/history', module: ImportHistoryModule }]
			}
		]),
		TypeOrmModule.forFeature([...coreEntities, ...getEntitiesFromPlugins(getConfig().plugins)]),
		MikroOrmModule.forFeature([...coreEntities, ...getEntitiesFromPlugins(getConfig().plugins)]),
		TenantModule,
		UserModule,
		ImportRecordModule,
		ImportHistoryModule,
		CqrsModule
	],
	controllers: [ImportController],
	providers: [ImportService, ...CommandHandlers],
	exports: []
})
export class ImportModule { }
