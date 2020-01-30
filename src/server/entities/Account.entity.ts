import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany,
} from 'typeorm';
import AccountDef from '../../common/AccountDef';
import CharacterEntity from './Character.entity';

@Entity()
export default class AccountEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ nullable: true })
    public session: string;

    @Column()
    public name: string;

    @Column()
    // eslint-disable-next-line camelcase
    public temp_username: string; // TODO: temp plaintext password

    @Column()
    // eslint-disable-next-line camelcase
    public temp_password: string; // TODO: temp plaintext password

    @OneToMany((type) => CharacterEntity, (character) => character.account)
    public characters: CharacterEntity[];

    // converts a db entity to a network account
    public toNet(): AccountDef {
        const a = <AccountDef>{
            name: this.name,
        };
        return a;
    }
}
