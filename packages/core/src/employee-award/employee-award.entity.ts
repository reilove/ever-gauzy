import { Column, Index, ManyToOne, RelationId } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IEmployee, IEmployeeAward } from '@gauzy/contracts';
import {
	Employee,
	TenantOrganizationBaseEntity
} from '../core/entities/internal';
import { MultiORMEntity } from './../core/decorators/entity';
import { MikroOrmEmployeeAwardRepository } from './repository/mikro-orm-employee-award.repository';

@MultiORMEntity('employee_award', { mikroOrmRepository: () => MikroOrmEmployeeAwardRepository })
export class EmployeeAward extends TenantOrganizationBaseEntity
	implements IEmployeeAward {

	@ApiProperty({ type: () => String })
	@Index()
	@Column()
	name: string;

	@ApiProperty({ type: () => String })
	@Column()
	year: string;

	/*
	|--------------------------------------------------------------------------
	| @ManyToOne
	|--------------------------------------------------------------------------
	*/
	@ApiProperty({ type: () => Employee })
	@ManyToOne(() => Employee, (it) => it.awards, {
		onDelete: 'CASCADE'
	})
	employee?: IEmployee;

	@ApiProperty({ type: () => String })
	@RelationId((it: EmployeeAward) => it.employee)
	@Index()
	@Column()
	employeeId?: string;
}
