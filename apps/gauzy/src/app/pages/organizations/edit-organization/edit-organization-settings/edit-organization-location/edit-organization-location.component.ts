import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ICountry, IOrganization } from '@gauzy/models';
import { NbToastrService } from '@nebular/theme';
import { OrganizationsService } from '../../../../../@core/services/organizations.service';
import { OrganizationEditStore } from '../../../../../@core/services/organization-edit-store.service';
import { filter } from 'rxjs/operators';
import { TranslationBaseComponent } from '../../../../../@shared/language-base/translation-base.component';
import { TranslateService } from '@ngx-translate/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '../../../../../@core/services/store.service';
@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'ga-edit-org-location',
	templateUrl: './edit-organization-location.component.html',
	styleUrls: ['./edit-organization-location.component.scss']
})
export class EditOrganizationLocationComponent
	extends TranslationBaseComponent
	implements OnInit, OnDestroy {
	organization: IOrganization;
	country: string;
	form: FormGroup;

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private organizationService: OrganizationsService,
		private toastrService: NbToastrService,
		private organizationEditStore: OrganizationEditStore,
		private store: Store,
		readonly translateService: TranslateService
	) {
		super(translateService);
	}

	ngOnInit(): void {
		this.store.selectedOrganization$
			.pipe(
				filter((organization) => !!organization),
				untilDestroyed(this)
			)
			.subscribe((organization) => {
				this._loadOrganizationData(organization);
			});
	}

	async updateOrganizationSettings() {
		const contact = {
			country: this.form.value.country,
			city: this.form.value.city,
			address: this.form.value.address,
			address2: this.form.value.address2,
			postcode: this.form.value.postcode
		};
		const contactData = {
			...this.form.value,
			contact
		};
		this.organizationService.update(this.organization.id, contactData);
		this.toastrService.primary(
			this.organization.name + ' organization location updated.',
			'Success'
		);
		this.goBack();
	}

	goBack() {
		this.router.navigate([
			`/pages/organizations/edit/${this.organization.id}`
		]);
	}

	//Initialize form
	private async _initializeForm() {
		this.form = this.fb.group({
			country: [''],
			city: [''],
			postcode: [''],
			address: [''],
			address2: ['']
		});
		setTimeout(() => {
			this._setValues();
		}, 200);
	}

	private _setValues() {
		if (!this.organization) {
			return;
		}

		const organization: IOrganization = this.organization;
		const { contact } = organization;
		if (contact) {
			this.form.setValue({
				country: contact.country,
				city: contact.city,
				postcode: contact.postcode,
				address: contact.address,
				address2: contact.address2
			});
			this.country = contact.country;
			this.form.updateValueAndValidity();
		}
	}

	private async _loadOrganizationData(organization) {
		if (!organization) {
			return;
		}
		const id = organization.id;
		const { tenantId } = this.store.user;
		const { items } = await this.organizationService.getAll(
			['contact', 'tags'],
			{ id, tenantId }
		);
		this.organization = items[0];
		this._initializeForm();
		this.organizationEditStore.selectedOrganization = this.organization;
	}

	/*
	 * On Changed Country Event Emitter
	 */
	countryChanged($event: ICountry) {}

	ngOnDestroy(): void {}
}
