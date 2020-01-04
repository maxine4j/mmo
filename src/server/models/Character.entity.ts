import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, ManyToOne,
} from 'typeorm';
import Buildable from '../../common/Buildable';
import Character, { Race } from '../../common/models/Character';
import AccountEntity from './Account.entity';

@Entity()
export default class CharacterEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column({ transformer: { from: (val: number) => <Race>val, to: (val: Race) => <number>val } })
    public race: Race;

    @Column()
    public level: number;

    @ManyToOne((type) => AccountEntity, (account) => account.characters)
    public account: AccountEntity;

    public build(): Buildable {
        return new Character().build({
            name: this.name,
            race: this.race,
            level: this.level,
        });
    }
}
