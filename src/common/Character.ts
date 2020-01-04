import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export default class Character {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public level: number;

    public constructor(name: string, level: number) {
        this.name = name;
        this.level = level;
    }
}
