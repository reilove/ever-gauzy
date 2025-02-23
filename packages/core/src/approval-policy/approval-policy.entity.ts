/*
 *  Approval Policy is predefined approval types for the organization.
 *	E.g. for example, "Business Trip", "Borrow Items", ...
 *  Approval Policy table has the many to one relationship to the Organization table and Tenant by organizationId and tenantId
 */
import { Index, Column } from 'typeorm';
import { IApprovalPolicy } from '@gauzy/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { TenantOrganizationBaseEntity } from '../core/entities/internal';
import { MultiORMEntity } from './../core/decorators/entity';
import { MikroOrmApprovalPolicyRepository } from './repository/mikro-orm-approval-policy.repository';

@MultiORMEntity('approval_policy', { mikroOrmRepository: () => MikroOrmApprovalPolicyRepository })
export class ApprovalPolicy extends TenantOrganizationBaseEntity
	implements IApprovalPolicy {

	@ApiProperty({ type: () => String })
	@Index()
	@Column()
	name: string;

	@ApiProperty({ type: () => String })
	@Column({ nullable: true })
	description: string;

	@ApiProperty({ type: () => String })
	@Column({ nullable: true })
	approvalType: string;
}
