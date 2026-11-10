import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1794258271190 implements MigrationInterface {
	name = 'InitSchema1794258271190';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "product" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "id" BIGSERIAL NOT NULL, "name" text NOT NULL, "sku" text NOT NULL, "description" text, "category" text, "price" numeric(12,2) NOT NULL DEFAULT '0', "stock" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "idx_product_sku" ON "product" ("sku") `);
		await queryRunner.query(
			`CREATE TABLE "user" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "id" BIGSERIAL NOT NULL, "email" text NOT NULL, "password" text NOT NULL, "fullName" text, "role" text NOT NULL DEFAULT 'user', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_email" ON "user" ("email") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`DROP INDEX "public"."idx_product_sku"`);
		await queryRunner.query(`DROP TABLE "product"`);
	}
}
