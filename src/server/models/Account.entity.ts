import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany,
} from 'typeorm';
import Account from '../../common/models/Account';
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
    public temp_username: string;

    @Column()
    public temp_password: string;

    @OneToMany((type) => CharacterEntity, (character) => character.account)
    public characters: CharacterEntity[];

    public build() {
        return new Account().build({
            name: this.name,
        });
    }
}
