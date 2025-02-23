import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { TenantModule } from '../tenant/tenant.module';
import { CandidateSkill } from './candidate-skill.entity';
import { CandidateSkillService } from './candidate-skill.service';
import { CandidateSkillController } from './candidate-skill.controller';
import { UserModule } from './../user/user.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
	imports: [
		RouterModule.register([{ path: '/candidate-skills', module: CandidateSkillModule }]),
		TypeOrmModule.forFeature([CandidateSkill]),
		MikroOrmModule.forFeature([CandidateSkill]),
		TenantModule,
		UserModule
	],
	providers: [CandidateSkillService],
	controllers: [CandidateSkillController],
	exports: [CandidateSkillService]
})
export class CandidateSkillModule { }
