import { isNotEmpty } from '@gauzy/common';
import { Injectable } from '@nestjs/common';
import {
	IIssueTypeFindInput,
	IPagination,
	ITaskPriorityFindInput,
	ITaskSizeFindInput,
	ITaskStatusFindInput,
	ITaskVersionFindInput
} from '@gauzy/contracts';
import { Brackets, Repository, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
import { TenantBaseEntity } from '../core/entities/internal';
import { RequestContext } from '../core/context';
import { TenantAwareCrudService } from '../core/crud';
import { EntityRepository } from '@mikro-orm/core';
import { prepareSQLQuery as p } from './../database/database.helper';

export type IFindEntityByParams =
	| ITaskStatusFindInput
	| ITaskPriorityFindInput
	| ITaskSizeFindInput
	| IIssueTypeFindInput
	| ITaskVersionFindInput;

@Injectable()
export class TaskStatusPrioritySizeService<
	BaseEntity extends TenantBaseEntity
> extends TenantAwareCrudService<BaseEntity> {
	constructor(
		typeOrmTaskStatusRepository: Repository<BaseEntity>,
		mikroOrmTaskStatusRepository?: EntityRepository<BaseEntity>
	) {
		super(typeOrmTaskStatusRepository, mikroOrmTaskStatusRepository);
	}

	async findEntitiesByParams(params: IFindEntityByParams): Promise<IPagination<BaseEntity>> {
		try {
			/**
			 * Find at least one record or get global records
			 */
			const cqb = this.repository.createQueryBuilder(this.alias);
			cqb.where((qb: SelectQueryBuilder<BaseEntity>) => {
				this.getFilterQuery(qb, params);
			});
			await cqb.getOneOrFail();

			/**
			 * Find task sizes/priorities for given params
			 */
			const query = this.repository.createQueryBuilder(this.alias);
			query.where((qb: SelectQueryBuilder<BaseEntity>) => {
				this.getFilterQuery(qb, params);
			});
			const [items, total] = await query.getManyAndCount();
			return { items, total };
		} catch (error) {
			return await this.getDefaultEntities();
		}
	}

	/**
	 * GET global system statuses/priorities/sizes
	 *
	 * @returns
	 */
	async getDefaultEntities(): Promise<IPagination<BaseEntity>> {
		const query = this.repository.createQueryBuilder(this.alias);
		query.where((qb: SelectQueryBuilder<BaseEntity>) => {
			qb.andWhere(
				new Brackets((bck: WhereExpressionBuilder) => {
					bck.andWhere(p(`"${qb.alias}"."organizationId" IS NULL`));
					bck.andWhere(p(`"${qb.alias}"."tenantId" IS NULL`));
					bck.andWhere(p(`"${qb.alias}"."projectId" IS NULL`));
					bck.andWhere(p(`"${qb.alias}"."organizationTeamId" IS NULL`));
					bck.andWhere(p(`"${qb.alias}"."isSystem" = :isSystem`), {
						isSystem: true
					});
				})
			);
		});
		const [items, total] = await query.getManyAndCount();
		return { items, total };
	}

	/**
	 * GET status filter query
	 *
	 * @param query
	 * @param request
	 * @returns
	 */
	getFilterQuery(query: SelectQueryBuilder<BaseEntity>, request: IFindEntityByParams) {
		const { tenantId, organizationId, projectId, organizationTeamId } = request;
		/**
		 * GET by tenant level
		 */
		if (isNotEmpty(tenantId)) {
			query.andWhere(p(`"${query.alias}"."tenantId" = :tenantId`), {
				tenantId: RequestContext.currentTenantId()
			});
		} else {
			query.andWhere(p(`"${query.alias}"."tenantId" IS NULL`));
		}
		/**
		 * GET by organization level
		 */
		if (isNotEmpty(organizationId)) {
			query.andWhere(p(`"${query.alias}"."organizationId" = :organizationId`), {
				organizationId
			});
		} else {
			query.andWhere(p(`"${query.alias}"."organizationId" IS NULL`));
		}
		/**
		 * GET by project level
		 */
		if (isNotEmpty(projectId)) {
			query.andWhere(p(`"${query.alias}"."projectId" = :projectId`), {
				projectId
			});
		} else {
			query.andWhere(p(`"${query.alias}"."projectId" IS NULL`));
		}

		/**
		 * GET by team level
		 */
		if (isNotEmpty(organizationTeamId)) {
			query.andWhere(p(`"${query.alias}"."organizationTeamId" = :organizationTeamId`), {
				organizationTeamId
			});
		} else {
			query.andWhere(p(`"${query.alias}"."organizationTeamId" IS NULL`));
		}
		return query;
	}
}
