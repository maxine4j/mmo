import UnitDef from './UnitDef';
import IDefinition from './IDefinition';

export const MAX_LEVEL = 99;

export enum Skill {
    ATTACK = 0,
    HITPOINTS = 1,
    MINING = 2,
    STRENGTH = 3,
    AGILITY = 4,
    SMITHING = 5,
    DEFENSE = 6,
    HERBLORE = 7,
    FISHING = 8,
    RANGED = 9,
    THIEVING = 10,
    COOKING = 11,
    PRAYER = 12,
    CRAFTING = 13,
    FIREMAKING = 14,
    MAGIC = 15,
    FLETCHING = 16,
    WOODCUTTING = 17,
    RUNECRAFTING = 18,
    SLAYER = 19,
    FARMING = 20,
    CONSTRUCTION = 21,
    HUNTER = 22,
}

export enum Race {
    HUMAN,
    DWARF,
    GNOME,
    NIGHTELF,
    ORC,
    UNDEAD,
}

export default interface CharacterDef extends UnitDef, IDefinition {
    race: Race;
}

export function expToLevel(exp: number): number {
    let totalExpReq = 0;
    for (let lvl = 1; lvl < MAX_LEVEL; lvl++) {
        totalExpReq += Math.floor(lvl - 1 + 300 * 2 ** ((lvl - 1) / 7)) / 4;
        if (totalExpReq > exp) return lvl;
    }
    return MAX_LEVEL;
}

export interface SkillDef extends IDefinition {
    id: Skill,
    experience: number,
    current: number,
}
