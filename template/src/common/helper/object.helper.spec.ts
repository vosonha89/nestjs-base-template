import { Expose } from 'class-transformer';
import { ObjectHelper } from './object.helper';

/** Target class exposing only part of its source shape. */
class NarrowTarget {
	@Expose()
	public id!: number;

	@Expose()
	public name?: string;

	/** Not exposed, must never be copied by {@link ObjectHelper.map}. */
	public secret?: string;
}

/** Plain target used by the `assign`/`compact` cases. */
class PlainTarget {
	public id?: number;

	public name?: string;

	public note?: string;
}

/** Target carrying a `Date` column. */
class DatedTarget {
	@Expose()
	public id!: number;

	@Expose()
	public createdAt!: Date;
}

describe('ObjectHelper', () => {
	describe('map', () => {
		it('should copy only @Expose properties by default', () => {
			const result = ObjectHelper.map({ id: 7, name: 'keyboard', secret: 'hunter2' }, NarrowTarget);

			expect(result).toBeInstanceOf(NarrowTarget);
			expect(result.id).toEqual(7);
			expect(result.name).toEqual('keyboard');
			expect(result.secret).toBeUndefined();
		});

		it('should copy every property when onlyExposed is false', () => {
			const result = ObjectHelper.map({ id: 7, name: 'keyboard', secret: 'hunter2' }, NarrowTarget, {
				onlyExposed: false
			});

			expect(result.secret).toEqual('hunter2');
		});

		it('should preserve Date instances instead of stringifying them', () => {
			const createdAt = new Date('2026-01-01T00:00:00.000Z');
			const result = ObjectHelper.map({ id: 1, createdAt }, DatedTarget);

			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.createdAt.toISOString()).toEqual('2026-01-01T00:00:00.000Z');
		});
	});

	describe('assign', () => {
		it('should copy defined properties onto the target', () => {
			const target = new PlainTarget();

			ObjectHelper.assign({ name: 'monitor', note: 'ips' }, target);

			expect(target.name).toEqual('monitor');
			expect(target.note).toEqual('ips');
		});

		it('should skip undefined values so a partial update cannot wipe a column', () => {
			const target = ObjectHelper.assign({ name: 'monitor' }, new PlainTarget());

			ObjectHelper.assign({ name: undefined, note: undefined }, target);

			expect(target.name).toEqual('monitor');
			expect(target.note).toBeUndefined();
		});

		it('should never overwrite ignored keys', () => {
			const target = ObjectHelper.assign({ id: 5 }, new PlainTarget());

			ObjectHelper.assign({ id: 99, name: 'hub' }, target, ['id']);

			expect(target.id).toEqual(5);
			expect(target.name).toEqual('hub');
		});

		it('should return the target untouched for a non object source', () => {
			const target = new PlainTarget();

			expect(ObjectHelper.assign(null, target)).toBe(target);
			expect(ObjectHelper.assign('nope', target)).toBe(target);
		});
	});

	describe('compact', () => {
		it('should drop undefined values and ignored keys', () => {
			const result = ObjectHelper.compact(new PlainTarget(), ['id']);

			expect(result).toEqual({});
		});

		it('should keep falsy values that are not undefined', () => {
			const result = ObjectHelper.compact({ id: 0, name: '', note: false });

			expect(result).toEqual({ id: 0, name: '', note: false });
		});
	});
});
