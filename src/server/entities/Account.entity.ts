import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany,
} from 'typeorm';
import Account from '../../common/Account';
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
    public temp_username: string;

    @Column()
    // eslint-disable-next-line camelcase
    public temp_password: string;

    @OneToMany((type) => CharacterEntity, (character) => character.account)
    public characters: CharacterEntity[];

    // converts a db entity to a network account
    public toNet(): Account {
        const a = <Account>{
            name: this.name,
        };
        return a;
    }
}
