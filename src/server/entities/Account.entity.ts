import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany,
} from 'typeorm';
import AccountDef from '../../common/definitions/AccountDef';
import CharacterEntity from './Character.entity';

@Entity()
export default class AccountEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public email: string;

    @Column()
    public passwordHash: string;

    @Column({ nullable: true })
    public session: string;

    @OneToMany((type) => CharacterEntity, (character) => character.account)
    public characters: CharacterEntity[];

    // converts a db entity to a network account
    public toNet(): AccountDef {
        const a = <AccountDef>{
            email: this.email,
        };
        return a;
    }
}
