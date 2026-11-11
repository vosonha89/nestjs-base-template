import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { ConstantValue } from '../constant/constant-value';
import { IHashService } from './hash.service.interface';

/**
 * Service symbol for DI register
 */
export const HashServiceSymbol = Symbol('HashService');

/**
 * bcrypt implementation of {@link IHashService}.
 *
 * Uses `bcryptjs` (pure JavaScript) rather than the native `bcrypt` binding so
 * a fresh `npm install` never needs a C++ toolchain — important for a template
 * that must build on any machine and inside slim containers. The output format
 * is identical (`$2b$`), so switching back to native bcrypt is a one line change.
 */
@Injectable()
export class BcryptHashService implements IHashService {
	/**
	 * Hashes a plain text secret with the configured cost factor.
	 * @param plain - Plain text value
	 * @returns The bcrypt hash
	 */
	public async hash(plain: string): Promise<string> {
		return hash(plain, ConstantValue.PASSWORD_HASH_ROUNDS);
	}

	/**
	 * Verifies a plain text secret against a stored bcrypt hash.
	 * @param plain - Plain text value supplied by the caller
	 * @param hashed - Previously stored hash
	 * @returns `true` when they match
	 */
	public async compare(plain: string, hashed: string): Promise<boolean> {
		return compare(plain, hashed);
	}
}
