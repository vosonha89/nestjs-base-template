/**
 * Source templates for `generate-feature.mjs`.
 *
 * Every string here must already satisfy the project's lint rules — explicit
 * access modifiers, explicit return types, JSDoc on exported symbols, tabs,
 * single quotes, 120 columns, no trailing comma. A generator that emits code
 * failing `npm run lint:check` is worse than no generator.
 */

/**
 * Renders the TypeORM entity.
 * @param {{Name: string, name: string, table: string, fields: object[], needsIndex: boolean, needsNumeric: boolean}} view - render context
 * @returns {string} the file content
 */
export function entity(view) {
	const typeormImports = view.needsIndex ? 'Column, Entity, Index' : 'Column, Entity';
	const decoratorNames = view.needsNumeric ? 'BigIntPrimaryColumn, numericTransformer' : 'BigIntPrimaryColumn';

	return `import { ${typeormImports} } from 'typeorm';
import { ${decoratorNames} } from '../decorator/bigint-column.decorator';
import { PsqlEntity } from './psql.entity';

/**
 * Represents a ${view.label}.
 * @extends PsqlEntity
 */
@Entity({ name: '${view.table}', schema: 'public' })
export class ${view.Name}Entity extends PsqlEntity<number> {
	/** Unique identifier for the ${view.label}. */
	@BigIntPrimaryColumn()
	public override id!: number;
${view.fields.map((field) => `\n${field.entityBlock}`).join('\n')}
}
`;
}

/**
 * Renders the read model returned to clients.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function dto(view) {
	return `import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseType } from '@common/base/base.type';

/**
 * Read model of a ${view.label}.
 *
 * Only \`@Expose()\`-decorated properties are copied out of the entity, so a
 * column added later cannot leak through the API by accident.
 */
export class ${view.Name}Dto extends BaseType<number> {
	/** Unique identifier. */
	@Expose()
	@ApiProperty({ example: 1 })
	public id!: number;
${view.fields.map((field) => `\n${field.dtoBlock}`).join('\n')}

	/** Creation timestamp. */
	@Expose()
	@ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
	public createdAt!: Date;

	/** Last modification timestamp. */
	@Expose()
	@ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
	public updatedAt!: Date;
}
`;
}

/**
 * Renders the business service contract.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function serviceInterface(view) {
	return `import { IBaseDataService } from '@common/base/base-data.service.interface';
import { ${view.Name}Dto } from './${view.kebab}.dto';

/**
 * Contract for the ${view.label} business service.
 *
 * A type alias rather than an empty \`interface extends\`: an interface with no
 * members of its own adds nothing here and trips
 * \`@typescript-eslint/no-empty-object-type\`. Turn it into an \`interface\` the
 * moment you add the first domain method, so the shape stays discoverable.
 */
export type I${view.Name}Service = IBaseDataService<${view.Name}Dto, number>;
`;
}

/**
 * Renders the business service.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function service(view) {
	const searchable = view.searchableFields.map((field) => `'${field}'`).join(', ');
	const sortable = view.sortableFields.map((field) => `'${field}'`).join(', ');

	return `import { Inject, Injectable } from '@nestjs/common';
import { BaseDataService } from '@common/base/base-data.service';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { ${view.Name}Entity } from '@data/entity/${view.kebab}.entity';
import { ${view.Name}Repository, ${view.Name}RepositorySymbol } from '@data/repository/${view.kebab}.repository';
import { ${view.Name}Dto } from './${view.kebab}.dto';
import { I${view.Name}Service } from './${view.kebab}.service.interface';

/**
 * Service symbol for DI register
 */
export const ${view.Name}ServiceSymbol = Symbol('${view.Name}Service');

/**
 * Business service for ${view.plural}.
 *
 * Everything the base class exposes stays available unchanged; add domain
 * methods here when a rule does not fit the generic CRUD surface.
 * @extends BaseDataService
 * @implements I${view.Name}Service
 */
@Injectable()
export class ${view.Name}Service
	extends BaseDataService<${view.Name}Dto, ${view.Name}Entity, number>
	implements I${view.Name}Service
{
	/**
	 * Constructor
	 * @param requestContext - Service exposing the current request
	 * @param ${view.camel}Repository - Repository for ${view.label} data access
	 */
	public constructor(
		@Inject(RequestContextServiceSymbol) requestContext: IRequestContextService,
		@Inject(${view.Name}RepositorySymbol) protected readonly ${view.camel}Repository: ${view.Name}Repository
	) {
		super(requestContext, ${view.camel}Repository, {
			dto: ${view.Name}Dto,
			entity: ${view.Name}Entity,
			searchableFields: [${searchable}],
			sortableFields: [${sortable}],
			defaultSortField: 'id',
			defaultSortDirection: 'DESC'
		});
	}
}
`;
}

/**
 * Renders the repository.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function repository(view) {
	return `import { Inject, Injectable } from '@nestjs/common';
import { PsqlContext, PsqlContextSymbol } from '../context/psql.context';
import { ${view.Name}Entity } from '../entity/${view.kebab}.entity';
import { PsqlRepository } from './psql.repository';

/**
 * Service symbol for DI register
 */
export const ${view.Name}RepositorySymbol = Symbol('${view.Name}Repository');

/**
 * Data access for {@link ${view.Name}Entity}.
 *
 * Only add methods the entity actually needs; the generic CRUD surface comes
 * from {@link PsqlRepository}.
 * @extends PsqlRepository
 */
@Injectable()
export class ${view.Name}Repository extends PsqlRepository<${view.Name}Entity, number> {
	/**
	 * Constructor
	 * @param psqlContext - Persistence context owning the connection pool
	 */
	public constructor(@Inject(PsqlContextSymbol) psqlContext: PsqlContext) {
		super(psqlContext, ${view.Name}Entity);
	}
}
`;
}

/**
 * Renders the create request.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function createRequest(view) {
	return `import { ApiProperty } from '@nestjs/swagger';
${view.createImportBlock}import { BaseCreateRequest } from '@common/base/base.request';

/**
 * Payload accepted by \`POST /api/v1/${view.kebab}\`.
 */
export class ${view.Name}CreateRequest extends BaseCreateRequest {
${view.fields.map((field) => field.createBlock).join('\n\n')}
}
`;
}

/**
 * Renders the update request.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function updateRequest(view) {
	return `import { ApiProperty } from '@nestjs/swagger';
${view.updateImportBlock}import { BaseUpdateRequest } from '@common/base/base.request';

/**
 * Payload accepted by \`PUT /api/v1/${view.kebab}/:id\`.
 * Every field is optional: only the ones present are written.
 */
export class ${view.Name}UpdateRequest extends BaseUpdateRequest {
${view.fields.map((field) => field.updateBlock).join('\n\n')}
}
`;
}

/**
 * Renders the search and delete requests.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function searchRequest(view) {
	return `import { BaseDeleteRequest, BaseSearchRequest } from '@common/base/base.request';

/**
 * Payload accepted by \`DELETE /api/v1/${view.kebab}/:id\`.
 * The identifier travels in the URL, so the body stays empty.
 */
export class ${view.Name}DeleteRequest extends BaseDeleteRequest {}

/**
 * Payload accepted by \`POST /api/v1/${view.kebab}/search\`.
 *
 * Filter and sort columns are restricted by \`${view.Name}Service.searchableFields\`
 * and \`${view.Name}Service.sortableFields\`.
 */
export class ${view.Name}SearchRequest extends BaseSearchRequest {}
`;
}

/**
 * Renders the Swagger list model.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function listResponse(view) {
	return `import { ApiProperty } from '@nestjs/swagger';
import { BaseListResponse } from '@common/base/base.response';
import { ${view.Name}Dto } from '@services/${view.kebab}/${view.kebab}.dto';

/**
 * Swagger model describing the paginated ${view.label} payload.
 */
export class ${view.Name}ListResponse extends BaseListResponse<${view.Name}Dto> {
	/** Page content. */
	@ApiProperty({ type: () => ${view.Name}Dto, isArray: true })
	public override elements: ${view.Name}Dto[] = [];
}
`;
}

/**
 * Renders the feature module.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function module(view) {
	return `import { Module } from '@nestjs/common';
import { ${view.Name}Service, ${view.Name}ServiceSymbol } from '@services/${view.kebab}/${view.kebab}.service';
import { ${view.Name}Controller } from './${view.kebab}.controller';

/**
 * Wires the ${view.label} controller to its business service.
 */
@Module({
	controllers: [${view.Name}Controller],
	providers: [
		{
			provide: ${view.Name}ServiceSymbol,
			useClass: ${view.Name}Service
		}
	],
	exports: [${view.Name}ServiceSymbol]
})
export class ${view.Name}Module {}
`;
}

/**
 * Renders a service unit-test skeleton.
 *
 * It is a starting point, not a finished suite: a generated test that asserts
 * nothing meaningful is worse than no test, so it carries one honest assertion
 * over the DI wiring and leaves the domain cases to the author.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function serviceSpec(view) {
	return `import { Test } from '@nestjs/testing';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { ${view.Name}RepositorySymbol } from '@data/repository/${view.kebab}.repository';
import { createRequestContextMock } from '@test/support/test-doubles';
import { ${view.Name}Service, ${view.Name}ServiceSymbol } from './${view.kebab}.service';
import { I${view.Name}Service } from './${view.kebab}.service.interface';

describe('${view.Name}Service', () => {
	let service: I${view.Name}Service;
	let repository: Record<string, jest.Mock>;

	beforeEach(async () => {
		repository = {
			createEntity: jest.fn(),
			findById: jest.fn(),
			findOne: jest.fn(),
			find: jest.fn(),
			count: jest.fn(),
			save: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			exists: jest.fn(),
			existsBy: jest.fn()
		};

		const moduleRef = await Test.createTestingModule({
			providers: [
				{ provide: ${view.Name}ServiceSymbol, useClass: ${view.Name}Service },
				{ provide: RequestContextServiceSymbol, useValue: createRequestContextMock() },
				{ provide: ${view.Name}RepositorySymbol, useValue: repository }
			]
		}).compile();

		service = moduleRef.get(${view.Name}ServiceSymbol);
	});

	it('should resolve through the DI container', () => {
		expect(service).toBeDefined();
	});

	it('should return undefined when the record does not exist', async () => {
		repository.findById.mockResolvedValue(null);

		await expect(service.findById(1)).resolves.toBeUndefined();
	});
});
`;
}

/**
 * Renders the controller.
 * @param {object} view - render context
 * @returns {string} the file content
 */
export function controller(view) {
	return `import { Controller, Inject } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { BaseDataController } from '@common/base/base-data.controller';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { ${view.Name}Dto } from '@services/${view.kebab}/${view.kebab}.dto';
import { ${view.Name}ServiceSymbol } from '@services/${view.kebab}/${view.kebab}.service';
import { I${view.Name}Service } from '@services/${view.kebab}/${view.kebab}.service.interface';
import { ${view.Name}CreateRequest } from './request/${view.kebab}-create.request';
import { ${view.Name}DeleteRequest, ${view.Name}SearchRequest } from './request/${view.kebab}-search.request';
import { ${view.Name}UpdateRequest } from './request/${view.kebab}-update.request';
import { ${view.Name}ListResponse } from './response/${view.kebab}-search.response';

/**
 * HTTP surface of the ${view.label} feature.
 *
 * All CRUD behaviour comes from {@link BaseDataController}; this class only
 * supplies the DTO, the request classes and the service binding, so it stays
 * free of business logic.
 */
@ApiTags('${view.kebab}')
@ApiExtraModels(${view.Name}ListResponse)
@Controller({ path: '${view.kebab}', version: '1' })
export class ${view.Name}Controller extends BaseDataController<
	${view.Name}Dto,
	number,
	${view.Name}SearchRequest,
	${view.Name}CreateRequest,
	${view.Name}UpdateRequest,
	${view.Name}DeleteRequest,
	I${view.Name}Service
>(${view.Name}Dto, ${view.Name}SearchRequest, ${view.Name}CreateRequest, ${view.Name}UpdateRequest, ${view.Name}DeleteRequest) {
	/**
	 * Constructor
	 * @param loggingService - Structured logger
	 * @param context - Request scoped data
	 * @param dataService - Business service backing this controller
	 */
	public constructor(
		@Inject(LoggingServiceSymbol) loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) context: IRequestContextService,
		@Inject(${view.Name}ServiceSymbol) dataService: I${view.Name}Service
	) {
		super(loggingService, context, dataService);
	}
}
`;
}