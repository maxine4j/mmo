import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, ManyToOne,
} from 'typeorm';
import { SkillDef } from '../../common/CharacterDef';
import CharacterEntity from './Character.entity';
import SkillTypeEntity from './SkillType.entity';

@Entity()
@Unique(['type', 'character'])
export default class SkillEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => CharacterEntity, (char) => char.skills, { onDelete: 'CASCADE' })
    public character: CharacterEntity;

    @ManyToOne((type) => SkillTypeEntity, { eager: true, onDelete: 'CASCADE' })
    public type: SkillTypeEntity;

    @Column({ default: 0 })
    public experience: number;

    @Column({ default: 1 })
    public current: number;

    public toNet(): SkillDef {
        return <SkillDef>{
            id: this.type.id,
            experience: this.experience,
            current: this.current,
        };
    }
}
