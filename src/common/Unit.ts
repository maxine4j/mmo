import { PointDef } from './Point';

export default interface Unit {
    id: number;
    name: string;
    level: number;
    model: string;
    running: boolean;
    position: PointDef;
    moveQueue: PointDef[];
}
