import { PointDef } from './Point';


export enum UnitAnimState {
    IDLE,
    ATTACK_MELEE,
    DEFEND,
    DYING
}

export default interface UnitDef {
    id: string;
    name: string;
    level: number;
    model: string;

    state: UnitAnimState;

    health: number;
    maxHealth: number;

    running: boolean;
    position: PointDef;
    moveQueue: PointDef[];

    target: string;
}
