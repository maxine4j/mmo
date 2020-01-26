import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity,
} from 'typeorm';

// This is an item definition. We use this entity to define the different items in the game

@Entity()
export default class ItemEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public icon: number;
}
