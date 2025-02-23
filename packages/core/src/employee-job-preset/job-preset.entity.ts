import {
	Column,
	Index,
	JoinTable,
	ManyToMany,
	OneToMany
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import {
	IEmployeeUpworkJobsSearchCriterion,
	IJobPresetUpworkJobSearchCriterion,
	IJobPreset
} from '@gauzy/contracts';
import {
	Employee,
	EmployeeUpworkJobsSearchCriterion,
	JobPresetUpworkJobSearchCriterion,
	TenantOrganizationBaseEntity
} from '../core/entities/internal';
import { MultiORMEntity } from './../core/decorators/entity';
import { MikroOrmJobPresetRepository } from './repository/mikro-orm-job-preset.repository';

@MultiORMEntity('job_preset', { mikroOrmRepository: () => MikroOrmJobPresetRepository })
export class JobPreset extends TenantOrganizationBaseEntity implements IJobPreset {

	@ApiProperty({ type: () => String })
	@IsString()
	@IsNotEmpty()
	@Index()
	@Column()
	name?: string;

	/*
	|--------------------------------------------------------------------------
	| @OneToMany
	|--------------------------------------------------------------------------
	*/
	/**
	 * Employee Job Criterions
	 */
	@OneToMany(() => EmployeeUpworkJobsSearchCriterion, (it) => it.jobPreset, {
		onDelete: 'CASCADE'
	})
	employeeCriterions?: IEmployeeUpworkJobsSearchCriterion[];

	/**
	 * Job Criterions
	 */
	@OneToMany(() => JobPresetUpworkJobSearchCriterion, (it) => it.jobPreset, {
		onDelete: 'CASCADE'
	})
	jobPresetCriterions?: IJobPresetUpworkJobSearchCriterion[];

	/*
	|--------------------------------------------------------------------------
	| @ManyToMany
	|--------------------------------------------------------------------------
	*/

	/**
	 * Job Preset Employees
	 */
	@ManyToMany(() => Employee, (employee) => employee.jobPresets, {
		cascade: true
	})
	@JoinTable({
		name: 'employee_job_preset'
	})
	employees?: Employee[];
}
