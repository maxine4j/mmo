import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne,
} from 'typeorm';
import Character, { Race, Facing } from '../../common/models/Character';
import AccountEntity from './Account.entity';

@Entity()
export default class CharacterEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => AccountEntity, (account) => account.characters)
    public account: AccountEntity;

    @Column({ nullable: true }) // TODO: temp
    public posX: number;

    @Column({ nullable: true }) // TODO: temp
    public posY: number;

    @Column({ nullable: true }) // TODO: temp
    public positionMapID: number;

    @Column()
    public name: string;

    @Column({ transformer: { from: (val: number) => <Race>val, to: (val: Race) => <number>val } })
    public race: Race;

    @Column()
    public level: number;

    // converts a db entity to a network character
    public toNet(): Character {
        const char = new Character();
        char.id = this.id;
        char.name = this.name;
        char.level = this.level;
        char.race = this.race;
        char.posX = this.posX;
        char.posY = this.posY;
        char.destX = -1;
        char.destY = -1;
        char.facing = Facing.NORTH;
        return char;
    }

    // converts a network character to a db entity
    public static async fromNet(c: Character): Promise<CharacterEntity> {
        return new Promise((resolve) => {
            this.findOne({ id: c.id }).then((ce) => {
                ce.level = c.level;
                ce.posX = c.posX;
                ce.posY = c.posY;
                ce.save();
                resolve(ce);
            });
        });
    }
}
