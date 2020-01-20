import { PointDef } from './Point';

export default interface UnitDef {
    id: number;
    name: string;
    level: number;
    model: string;
    running: boolean;
    position: PointDef;
    moveQueue: PointDef[];
}
