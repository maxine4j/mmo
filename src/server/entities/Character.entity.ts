import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, OneToOne, JoinColumn,
} from 'typeorm';
import CharacterDef, { Race } from '../../common/CharacterDef';
import AccountEntity from './Account.entity';
import InventoryEntity from './Inventory.entity';

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

    @OneToOne((type) => InventoryEntity, { eager: true, cascade: true })
    @JoinColumn()
    public bags: InventoryEntity;

    @OneToOne((type) => InventoryEntity, { eager: true, cascade: true })
    @JoinColumn()
    public bank: InventoryEntity;

    // converts a db entity to a network character
    public toNet(): CharacterDef {
        const char = <CharacterDef>{
            id: this.id.toString(),
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
}
