import { DeleteResult } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	IOrganization,
	IPagination,
	ITaskRelatedIssueType,
	ITaskRelatedIssueTypeCreateInput,
	ITaskRelatedIssueTypeFindInput,
} from '@gauzy/contracts';
import { TaskStatusPrioritySizeService } from '../task-status-priority-size.service';
import { RequestContext } from '../../core/context';
import { TaskRelatedIssueType } from './related-issue-type.entity';
import { TypeOrmTaskRelatedIssueTypeRepository } from './repository/type-orm-related-issue-type.repository';
import { MikroOrmTaskRelatedIssueTypeRepository } from './repository/mikro-orm-related-issue-type.repository';

@Injectable()
export class TaskRelatedIssueTypeService extends TaskStatusPrioritySizeService<TaskRelatedIssueType> {
	constructor(
		@InjectRepository(TaskRelatedIssueType)
		typeOrmTaskRelatedIssueTypeRepository: TypeOrmTaskRelatedIssueTypeRepository,

		mikroOrmTaskRelatedIssueTypeRepository: MikroOrmTaskRelatedIssueTypeRepository
	) {
		super(typeOrmTaskRelatedIssueTypeRepository, mikroOrmTaskRelatedIssueTypeRepository);
	}

	/**
	 * GET statuses by filters
	 * If parameters not match, retrieve global statuses
	 *
	 * @param params
	 * @returns
	 */
	async findTaskRelatedIssueType(
		params: ITaskRelatedIssueTypeFindInput
	): Promise<IPagination<TaskRelatedIssueType>> {
		try {
			return await this.findEntitiesByParams(params);
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * Few RelatedIssueTypes can't be removed/delete because they are global
	 *
	 * @param id
	 * @returns
	 */
	async delete(id: ITaskRelatedIssueType['id']): Promise<DeleteResult> {
		return await super.delete(id, {
			where: {
				isSystem: false,
			},
		});
	}

	/**
	 * Create bulk statuses for specific organization
	 *
	 * @param organization
	 */
	async bulkCreateOrganizationRelatedIssueTypes(
		organization: IOrganization
	): Promise<ITaskRelatedIssueType[] & TaskRelatedIssueType[]> {
		try {
			const statuses: ITaskRelatedIssueType[] = [];

			const tenantId = RequestContext.currentTenantId();
			const { items = [] } = await this.findEntitiesByParams({
				tenantId,
			});

			for (const item of items) {
				const { tenantId, name, value, description, icon, color } =
					item;
				const status = new TaskRelatedIssueType({
					tenantId,
					name,
					value,
					description,
					icon,
					color,
					organization,
					isSystem: false,
				});
				statuses.push(status);
			}
			return await this.repository.save(statuses);
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * Create bulk statuses for specific organization entity
	 *
	 * @param entity
	 * @returns
	 */
	async createBulkRelatedIssueTypesByEntity(
		entity: Partial<ITaskRelatedIssueTypeCreateInput>
	): Promise<ITaskRelatedIssueType[]> {
		try {
			const { organizationId } = entity;
			const tenantId = RequestContext.currentTenantId();

			const statuses: ITaskRelatedIssueType[] = [];
			const { items = [] } = await this.findEntitiesByParams({
				tenantId,
				organizationId,
			});

			for (const item of items) {
				const { name, value, description, icon, color } = item;

				const status = await this.create({
					...entity,
					name,
					value,
					description,
					icon,
					color,
					isSystem: false,
				});
				statuses.push(status);
			}

			return statuses;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}
}
