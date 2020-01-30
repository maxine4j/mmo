import { PointDef } from './Point';
import IDefinition from './IDefinition';

export default interface UnitDef extends IDefinition {
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
