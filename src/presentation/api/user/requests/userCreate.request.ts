import { BaseCreateRequest } from "../../../../core/domain/common/base/base.request";
import validator from "validator";
import { GlobalError } from "../../../../core/domain/types/globalError.type";
import { BadRequest } from "../../../../core/domain/types/errorResponse.type";
import { ClientError } from "../../../../core/domain/common/base/base.exceptions";
import { ApiProperty } from "@nestjs/swagger";

export class UserCreateRequest extends BaseCreateRequest {
	@ApiProperty()
	public firstName!: string;

	@ApiProperty()
	public lastName!: string;

	@ApiProperty()
	public maidenName!: string;

	@ApiProperty()
	public age!: number;

	@ApiProperty()
	public gender!: string;

	@ApiProperty()
	public email!: string;

	@ApiProperty()
	public phone!: string;

	@ApiProperty()
	public username!: string;

	@ApiProperty()
	public password!: string;

	@ApiProperty()
	public birthDate!: string;

	@ApiProperty()
	public image!: string;

	@ApiProperty()
	public bloodGroup!: string;

	@ApiProperty()
	public height!: number;

	@ApiProperty()
	public weight!: number;

	@ApiProperty()
	public eyeColor!: string;

	@ApiProperty()
	public hairColor!: string;

	@ApiProperty()
	public hairType!: string;

	@ApiProperty()
	public ip!: string;

	@ApiProperty()
	public addressAddress!: string;

	@ApiProperty()
	public addressCity!: string;

	@ApiProperty()
	public addressState!: string;

	@ApiProperty()
	public addressStateCode!: string;

	@ApiProperty()
	public addressPostalCode!: string;

	@ApiProperty()
	public addressCoordinatesLat!: number;

	@ApiProperty()
	public addressCoordinatesLng!: number;

	@ApiProperty()
	public addressCountry!: string;

	@ApiProperty()
	public macAddress!: string;

	@ApiProperty()
	public university!: string;

	@ApiProperty()
	public bankCardExpire!: string;

	@ApiProperty()
	public bankCardNumber!: string;

	@ApiProperty()
	public bankCardType!: string;

	@ApiProperty()
	public bankCurrency!: string;

	@ApiProperty()
	public bankIban!: string;

	@ApiProperty()
	public companyDepartment!: string;

	@ApiProperty()
	public companyName!: string;

	@ApiProperty()
	public companyTitle!: string;

	@ApiProperty()
	public companyAddressAddress!: string;

	@ApiProperty()
	public companyAddressCity!: string;

	@ApiProperty()
	public companyAddressState!: string;

	@ApiProperty()
	public companyAddressStateCode!: string;

	@ApiProperty()
	public companyAddressPostalCode!: string;

	@ApiProperty()
	public companyAddressCoordinatesLat!: number;

	@ApiProperty()
	public companyAddressCoordinatesLng!: number;

	@ApiProperty()
	public companyAddressCountry!: string;

	@ApiProperty()
	public ein!: string;

	@ApiProperty()
	public ssn!: string;

	@ApiProperty()
	public userAgent!: string;

	@ApiProperty()
	public cryptoCoin!: string;

	@ApiProperty()
	public cryptoWallet!: string;

	@ApiProperty()
	public cryptoNetwork!: string;

	@ApiProperty()
	public role!: string;

	public isValid(): boolean {
		const me = this;
		if (!me.username) {
			const error = GlobalError.RequiredError('username');
			me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
			return false;
		} else if (!me.email) {
			const error = GlobalError.RequiredError('email');
			me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
			return false;
		} else if (!me.phone) {
			const error = GlobalError.RequiredError('phone');
			me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
			return false;
		} else if (!validator.isNumeric(me.age.toString())) {
			const error = GlobalError.TypeError('age', 'number');
			me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
		}
		return true;
	}
}
