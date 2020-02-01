import { Skill, ExperienceDrop } from '../../common/CharacterDef';
import { CombatStatsDef, CombatStyle } from '../../common/UnitDef';
import Unit from './Unit';

function styleBonusAttack(style: CombatStyle): number {
    switch (style) {
    case CombatStyle.MELEE_ACCURATE: return 3;
    case CombatStyle.MELEE_AGGRESSIVE: return 0;
    case CombatStyle.MELEE_DEFENSIVE: return 0;
    case CombatStyle.MELEE_CONTROLLED: return 1;

    case CombatStyle.RANGED_ACCURATE: return 3;
    case CombatStyle.RANGED_RAPID: return 0;
    case CombatStyle.RANGED_LONGRANGE: return 0;
    default: return 0;
    }
}

function styleBonusStrength(style: CombatStyle): number {
    switch (style) {
    case CombatStyle.MELEE_ACCURATE: return 0;
    case CombatStyle.MELEE_AGGRESSIVE: return 3;
    case CombatStyle.MELEE_DEFENSIVE: return 0;
    case CombatStyle.MELEE_CONTROLLED: return 1;

    case CombatStyle.RANGED_ACCURATE: return 0;
    case CombatStyle.RANGED_RAPID: return 0;
    case CombatStyle.RANGED_LONGRANGE: return 0;
    default: return 0;
    }
}

function styleBonusDefense(style: CombatStyle): number {
    switch (style) {
    case CombatStyle.MELEE_ACCURATE: return 0;
    case CombatStyle.MELEE_AGGRESSIVE: return 0;
    case CombatStyle.MELEE_DEFENSIVE: return 3;
    case CombatStyle.MELEE_CONTROLLED: return 1;

    case CombatStyle.RANGED_LONGRANGE: return 3;
    default: return 0;
    }
}

function calcEffectiveStrength(strLevel: number, potBonus: number, prayerBonus: number, otherBonus: number, styleBonus: number): number {
    return Math.floor((strLevel + potBonus) * prayerBonus * otherBonus) + styleBonus;
}

function calcMaxHit(effectiveStr: number, strBonus: number, specBonus: number): number {
    return Math.floor((1.3 + effectiveStr / 10 + strBonus / 80 + (effectiveStr + strBonus) / 640) * specBonus);
}

export function calcCombatExp(dmg: number, style: CombatStyle): ExperienceDrop[] {
    switch (style) {
    case CombatStyle.MELEE_ACCURATE:
        return [
            { amount: dmg * 4, skill: Skill.ATTACK },
            { amount: dmg * 1.33, skill: Skill.HITPOINTS },
        ];
    case CombatStyle.MELEE_AGGRESSIVE:
        return [
            { amount: dmg * 4, skill: Skill.STRENGTH },
            { amount: dmg * 1.33, skill: Skill.HITPOINTS },
        ];
    case CombatStyle.MELEE_CONTROLLED:
        return [
            { amount: dmg * 1.33, skill: Skill.ATTACK },
            { amount: dmg * 1.33, skill: Skill.STRENGTH },
            { amount: dmg * 1.33, skill: Skill.DEFENSE },
            { amount: dmg * 1.33, skill: Skill.HITPOINTS },
        ];
    case CombatStyle.MELEE_DEFENSIVE:
        return [
            { amount: dmg * 4, skill: Skill.DEFENSE },
            { amount: dmg * 1.33, skill: Skill.HITPOINTS },
        ];

    case CombatStyle.RANGED_ACCURATE:
        return [
            { amount: dmg * 4, skill: Skill.RANGED },
            { amount: dmg * 1.33, skill: Skill.HITPOINTS },
        ];
    case CombatStyle.RANGED_RAPID:
        return [
            { amount: dmg * 4, skill: Skill.RANGED },
            { amount: dmg * 1.33, skill: Skill.HITPOINTS },
        ];
    case CombatStyle.RANGED_LONGRANGE:
        return [
            { amount: dmg * 2, skill: Skill.RANGED },
            { amount: dmg * 2, skill: Skill.DEFENSE },
            { amount: dmg * 1.33, skill: Skill.HITPOINTS },
        ];

    case CombatStyle.MAGIC_STANDARD:
    case CombatStyle.MAGIC_DEFENSIVE:
        return [{ amount: 0, skill: Skill.MAGIC }];

    default: return [{ amount: 0, skill: Skill.HITPOINTS }];
    }
}

export default class Attack {
    public attacker: Unit;
    public attackerStats: CombatStatsDef;
    public defender: Unit;
    public defenderStats: CombatStatsDef;

    public constructor(attacker: Unit, attackerStats: CombatStatsDef, defender: Unit, defenderStats: CombatStatsDef) {
        this.attacker = attacker;
        this.attackerStats = attackerStats;
        this.defender = defender;
        this.defenderStats = defenderStats;
    }

    private get hitChance(): number {
        const attackerBoostedLevel = this.attackerStats.attack + this.attackerStats.bonuses.potion.attack;
        const attackerAdjustedLevel = Math.ceil(attackerBoostedLevel * this.attackerStats.bonuses.prayer.attack);
        const attackerEffectiveLevel = Math.floor(attackerAdjustedLevel + styleBonusAttack(this.attacker.combatStyle) + 8);
        const attackerBonus = this.attackerStats.bonuses.equipment.attack.stab; // TODO: get weapon attack style here when implemented
        const attackerRoll = attackerEffectiveLevel * (attackerBonus + 64);

        const defenderBoostedLevel = this.defenderStats.defense + this.defenderStats.bonuses.potion.defense;
        const defenderAdjustedLevel = Math.ceil(defenderBoostedLevel * this.defenderStats.bonuses.prayer.defense);
        const defenderEffectiveLevel = Math.floor(defenderAdjustedLevel + styleBonusDefense(this.defender.combatStyle) + 8);
        const defenderBonus = this.defenderStats.bonuses.equipment.defense.stab; // TODO: get weapon attack style here when implemented
        const defenderRoll = defenderEffectiveLevel * (defenderBonus + 64);

        if (defenderRoll > attackerRoll) {
            return attackerRoll / ((2 * defenderRoll) + 1);
        }
        return 1 - ((defenderRoll + 2) / ((2 * attackerRoll) + 1));
    }

    private get maxHit(): number {
        switch (this.attacker.combatStyle) {
        case CombatStyle.MELEE_ACCURATE:
        case CombatStyle.MELEE_AGGRESSIVE:
        case CombatStyle.MELEE_CONTROLLED:
        case CombatStyle.MELEE_DEFENSIVE:
            return calcMaxHit(
                calcEffectiveStrength(
                    this.attackerStats.strength,
                    this.attackerStats.bonuses.potion.strength,
                    this.attackerStats.bonuses.prayer.strength,
                    1,
                    styleBonusStrength(this.attacker.combatStyle),
                ),
                this.attackerStats.bonuses.equipment.other.meleeStr,
                1,
            );
        case CombatStyle.RANGED_ACCURATE:
        case CombatStyle.RANGED_RAPID:
        case CombatStyle.RANGED_LONGRANGE:
            return calcMaxHit(
                calcEffectiveStrength(
                    this.attackerStats.ranged,
                    this.attackerStats.bonuses.potion.ranged,
                    this.attackerStats.bonuses.prayer.ranged,
                    1,
                    styleBonusStrength(this.attacker.combatStyle),
                ),
                this.attackerStats.bonuses.equipment.other.rangedStr,
                1,
            );
        case CombatStyle.MAGIC_STANDARD:
        case CombatStyle.MAGIC_DEFENSIVE:
            return -1; // NYI
        default: return -1;
        }
    }

    public perform(): number {
        let dmg = 0;
        if (Math.random() < this.hitChance) {
            dmg = Math.floor(Math.random() * this.maxHit + 1);
        }
        this.defender.takeHit(dmg, this.attacker);
        return dmg;
    }
}
