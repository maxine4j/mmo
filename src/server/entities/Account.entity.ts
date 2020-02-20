import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany,
} from 'typeorm';
import CharacterEntity from './Character.entity';

@Entity()
export default class AccountEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public email: string;

    @Column()
    public passwordHash: string;

    @Column({ nullable: true })
    public session: string;

    @OneToMany((type) => CharacterEntity, (character) => character.account)
    public characters: CharacterEntity[];
}
