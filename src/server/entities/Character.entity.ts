import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, OneToOne, JoinColumn, OneToMany, FindConditions, FindOneOptions,
} from 'typeorm';
import CharacterDef, { Race } from '../../common/definitions/CharacterDef';
import AccountEntity from './Account.entity';
import InventoryEntity from './Inventory.entity';
import SkillEntity from './Skill.entity';

@Entity()
export default class CharacterEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => AccountEntity, (account) => account.characters, { onDelete: 'CASCADE' })
    public account: AccountEntity;

    @Column()
    public posX: number;

    @Column()
    public posY: number;

    @Column()
    public positionMapID: number;

    @Column()
    public name: string;

    @Column({ transformer: { from: (val: number) => <Race>val, to: (val: Race) => <number>val } })
    public race: Race;

    @Column()
    public level: number;

    @Column({ default: false })
    public running: boolean;

    @Column({ default: true })
    public autoRetaliate: boolean;

    @OneToMany((type) => SkillEntity, (skill) => skill.character, { eager: true, cascade: true })
    public skills: SkillEntity[];

    @OneToOne((type) => InventoryEntity, { eager: true, cascade: true })
    @JoinColumn()
    public bags: InventoryEntity;

    @OneToOne((type) => InventoryEntity, { eager: true, cascade: true })
    @JoinColumn()
    public bank: InventoryEntity;

    // converts a db entity to a network character
    public toNet(): CharacterDef {
        const char = <CharacterDef>{
            uuid: this.id.toString(),
            name: this.name,
            level: this.level,
            race: this.race,
            position: {
                x: this.posX,
                y: this.posY,
            },
        };
        return char;
    }

    public static findOneSorted(conditions?: FindConditions<CharacterEntity>, options?: FindOneOptions<CharacterEntity>): Promise<CharacterEntity> {
        return new Promise((resolve, reject) => {
            CharacterEntity.findOne(conditions, options)
                .then((ce) => {
                    ce.skills.sort((a, b) => {
                        if (a.type.id > b.type.id) return 1;
                        if (a.type.id < b.type.id) return -1;
                        return 0;
                    });
                    resolve(ce);
                })
                .catch((err) => reject(err));
        });
    }
}
