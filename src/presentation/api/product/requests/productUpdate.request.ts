import validator from "validator";
import { GlobalError } from "../../../../core/domain/types/globalError.type";
import { BadRequest } from "../../../../core/domain/types/errorResponse.type";
import { ClientError } from "../../../../core/domain/common/base/base.exceptions";
import { ApiProperty } from "@nestjs/swagger";
import { BaseUpdateRequest } from "../../../../core/domain/common/base/base.request";

export class ProductUpdateRequest extends BaseUpdateRequest {
	@ApiProperty()
	public title!: string;
	@ApiProperty()
	public description!: string;
	@ApiProperty()
	public category!: string;
	@ApiProperty()
	public price!: number;
	@ApiProperty()
	public discountPercentage!: number;
	@ApiProperty()
	public rating!: number;
	@ApiProperty()
	public stock!: number;
	@ApiProperty()
	public tags!: any;
	@ApiProperty()
	public brand!: string;
	@ApiProperty()
	public sku!: string;
	@ApiProperty()
	public weight!: number;
	@ApiProperty()
	public dimensionsWidth!: number;
	@ApiProperty()
	public dimensionsHeight!: number;
	@ApiProperty()
	public dimensionsDepth!: number;
	@ApiProperty()
	public warrantyInformation!: string;
	@ApiProperty()
	public shippingInformation!: string;
	@ApiProperty()
	public availabilityStatus!: string;
	@ApiProperty()
	public reviews!: any;
	@ApiProperty()
	public returnPolicy!: string;
	@ApiProperty()
	public minimumOrderQuantity!: number;
	@ApiProperty()
	public metaCreatedAt!: string;
	@ApiProperty()
	public metaUpdatedAt!: string;
	@ApiProperty()
	public metaBarcode!: string;
	@ApiProperty()
	public metaQrCode!: string;
	@ApiProperty()
	public images!: any;
	@ApiProperty()
	public thumbnail!: string;

	public isValid(): boolean {
		const me = this;
		if (!me.title) {
			const error = GlobalError.RequiredError('title');
			me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
			return false;
		} else if (!me.category) {
			const error = GlobalError.RequiredError('category');
			me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
			return false;
		} else if (me.price && !validator.isNumeric(me.price.toString())) {
			const error = GlobalError.TypeError('price', 'number');
			me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
		}
		return true;
	}
}
