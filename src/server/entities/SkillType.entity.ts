import {
    Entity, Column, BaseEntity, PrimaryColumn,
} from 'typeorm';

@Entity()
export default class SkillTypeEntity extends BaseEntity {
    @PrimaryColumn()
    public id: number;

    @Column()
    public name: string;
}
