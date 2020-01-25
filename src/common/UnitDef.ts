import { PointDef } from './Point';

export default interface UnitDef {
    id: string;
    name: string;
    level: number;
    model: string;

    health: number;
    maxHealth: number;
    autoRetaliate: boolean;

    running: boolean;
    position: PointDef;
    moveQueue: PointDef[];

    target: string;
}
