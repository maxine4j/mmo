import { PointDef } from './Point';
import IDefinition from './IDefinition';

export enum CombatStyle {
    MELEE_ACCURATE,
    MELEE_AGGRESSIVE,
    MELEE_DEFENSIVE,
    MELEE_CONTROLLED,

    RANGED_ACCURATE,
    RANGED_RAPID,
    RANGED_LONGRANGE,

    MAGIC_STANDARD,
    MAGIC_DEFENSIVE,
}

export enum WeaponStyle {
    SLASH,
    STAB,
    CRUSH,
    MAGIC,
    RANGED,
}

export interface StyleBonusDef {
    stab: number;
    slash: number;
    crush: number;
    magic: number;
    ranged: number;
}

export interface OtherBonusDef {
    meleeStr: number;
    rangedStr: number;
    magicDamage: number;
    prayer: number;
}

export interface CombatStatsDef {
    attack: number;
    strength: number;
    defense: number;
    magic: number;
    ranged: number;
    hitpoints: number;
    prayer: number;

    bonuses: {
        equipment: {
            attack: StyleBonusDef;
            defense: StyleBonusDef;
            other: OtherBonusDef;
        },
        potion: {
            attack: number;
            strength: number;
            defense: number;
            magic: number;
            ranged: number;
        },
        prayer: {
            attack: number;
            strength: number;
            defense: number;
            magic: number;
            ranged: number;
        }
    }
}

export default interface UnitDef extends IDefinition {
    id: string;
    name: string;
    level: number;
    model: string;

    health: number;
    maxHealth: number;
    autoRetaliate: boolean;
    combatStyle: CombatStyle;

    running: boolean;
    position: PointDef;
    moveQueue: PointDef[];

    target: string;
}
