import { PointDef } from './Point';

export default interface UnitDef {
    id: string;
    name: string;
    target: string;
    level: number;
    model: string;
    animation: string;
    running: boolean;
    health: number;
    maxHealth: number;
    position: PointDef;
    moveQueue: PointDef[];
}
