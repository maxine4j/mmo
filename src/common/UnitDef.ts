import { PointDef } from './Point';

export enum UnitTickAction {
    IDLE,
    COMABT_IDLE,
    MELEE,
    FLINCH
}

export default interface UnitDef {
    id: string;
    name: string;
    level: number;
    model: string;

    health: number;
    maxHealth: number;
    // tickAction: UnitTickAction,

    running: boolean;
    position: PointDef;
    moveQueue: PointDef[];

    target: string;
}
