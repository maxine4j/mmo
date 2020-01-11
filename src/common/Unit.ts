import Point from './Point';

export default interface Unit {
    id: number;
    name: string;
    level: number;
    model: string;
    position: Point;
    lastPosition: Point;
}
