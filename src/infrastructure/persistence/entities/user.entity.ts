import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { PsqlEntity } from "../database/psqlEntity";

@Entity({ name: 'user', schema: 'public' })
export class UserEntity extends PsqlEntity<number> {
	@PrimaryGeneratedColumn('increment', { type: 'bigint' })
	id!: number;

    @Column({ name: 'firstName', type: 'text', nullable: true })
    firstName?: string;

    @Column({ name: 'lastName', type: 'text', nullable: true })
    lastName?: string;

    @Column({ name: 'maidenName', type: 'text', nullable: true })
    maidenName?: string;

    @Column({ type: 'integer', nullable: true })
    age?: number;

    @Column({ type: 'text', nullable: true })
    gender?: string;

    @Column({ type: 'text', nullable: true })
    email?: string;

    @Column({ type: 'text', nullable: true })
    phone?: string;

    @Column({ type: 'text', nullable: true })
    username?: string;

    @Column({ type: 'text', nullable: true })
    password?: string;

    @Column({ name: 'birthDate', type: 'text', nullable: true })
    birthDate?: string;

    @Column({ type: 'text', nullable: true })
    image?: string;

    @Column({ name: 'bloodGroup', type: 'text', nullable: true })
    bloodGroup?: string;

    @Column({ type: 'float', nullable: true })
    height?: number;

    @Column({ type: 'float', nullable: true })
    weight?: number;

    @Column({ name: 'eyeColor', type: 'text', nullable: true })
    eyeColor?: string;

    @Column({ name: 'hair.color', type: 'text', nullable: true })
    hairColor?: string;

    @Column({ name: 'hair.type', type: 'text', nullable: true })
    hairType?: string;

    @Column({ type: 'text', nullable: true })
    ip?: string;

    @Column({ name: 'address.address', type: 'text', nullable: true })
    addressAddress?: string;

    @Column({ name: 'address.city', type: 'text', nullable: true })
    addressCity?: string;

    @Column({ name: 'address.state', type: 'text', nullable: true })
    addressState?: string;

    @Column({ name: 'address.stateCode', type: 'text', nullable: true })
    addressStateCode?: string;

    @Column({ name: 'address.postalCode', type: 'text', nullable: true })
    addressPostalCode?: string;

    @Column({ name: 'address.coordinates.lat', type: 'float', nullable: true })
    addressCoordinatesLat?: number;

    @Column({ name: 'address.coordinates.lng', type: 'float', nullable: true })
    addressCoordinatesLng?: number;

    @Column({ name: 'address.country', type: 'text', nullable: true })
    addressCountry?: string;

    @Column({ name: 'macAddress', type: 'text', nullable: true })
    macAddress?: string;

    @Column({ type: 'text', nullable: true })
    university?: string;

    @Column({ name: 'bank.cardExpire', type: 'text', nullable: true })
    bankCardExpire?: string;

    @Column({ name: 'bank.cardNumber', type: 'text', nullable: true })
    bankCardNumber?: string;

    @Column({ name: 'bank.cardType', type: 'text', nullable: true })
    bankCardType?: string;

    @Column({ name: 'bank.currency', type: 'text', nullable: true })
    bankCurrency?: string;

    @Column({ name: 'bank.iban', type: 'text', nullable: true })
    bankIban?: string;

    @Column({ name: 'company.department', type: 'text', nullable: true })
    companyDepartment?: string;

    @Column({ name: 'company.name', type: 'text', nullable: true })
    companyName?: string;

    @Column({ name: 'company.title', type: 'text', nullable: true })
    companyTitle?: string;

    @Column({ name: 'company.address.address', type: 'text', nullable: true })
    companyAddressAddress?: string;

    @Column({ name: 'company.address.city', type: 'text', nullable: true })
    companyAddressCity?: string;

    @Column({ name: 'company.address.state', type: 'text', nullable: true })
    companyAddressState?: string;

    @Column({ name: 'company.address.stateCode', type: 'text', nullable: true })
    companyAddressStateCode?: string;

    @Column({ name: 'company.address.postalCode', type: 'text', nullable: true })
    companyAddressPostalCode?: string;

    @Column({ name: 'company.address.coordinates.lat', type: 'float', nullable: true })
    companyAddressCoordinatesLat?: number;

    @Column({ name: 'company.address.coordinates.lng', type: 'float', nullable: true })
    companyAddressCoordinatesLng?: number;

    @Column({ name: 'company.address.country', type: 'text', nullable: true })
    companyAddressCountry?: string;

    @Column({ type: 'text', nullable: true })
    ein?: string;

    @Column({ type: 'text', nullable: true })
    ssn?: string;

    @Column({ name: 'userAgent', type: 'text', nullable: true })
    userAgent?: string;

    @Column({ name: 'crypto.coin', type: 'text', nullable: true })
    cryptoCoin?: string;

    @Column({ name: 'crypto.wallet', type: 'text', nullable: true })
    cryptoWallet?: string;

    @Column({ name: 'crypto.network', type: 'text', nullable: true })
    cryptoNetwork?: string;

    @Column({ name: 'role', type: 'text', nullable: true })
    role?: string;
}
