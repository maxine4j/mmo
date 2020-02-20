import { TypedEmitter } from '../../common/TypedEmitter';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, UnitMovedPacket, UnitPacket, IDPacket, DamagePacket,
} from '../../common/Packet';
import Unit, { UnitAnimation } from '../models/Unit';
import World from '../models/World';

type UnitManagerEvent = 'added' | 'removed' | 'damaged';

export default class UnitManager extends TypedEmitter<UnitManagerEvent> {
    private world: World;
    private units: Map<string, Unit> = new Map();

    public constructor(world: World) {
        super();

        this.world = world;
        this.world.on('tick', this.tick.bind(this));

        NetClient.on(PacketHeader.UNIT_ADDED, this.handleUnitAdded.bind(this));
        NetClient.on(PacketHeader.UNIT_MOVED, this.handleUnitMoved.bind(this));
        NetClient.on(PacketHeader.UNIT_DIED, this.handleUnitDied.bind(this));
        NetClient.on(PacketHeader.UNIT_DAMAGED, this.handleUnitDamaged.bind(this));
    }

    private handleUnitAdded(packet: UnitPacket): void {
        const unit = new Unit(this.world, packet);
        this.addUnit(unit);
    }

    private handleUnitMoved(packet: UnitMovedPacket): void {
        const unit = this.units.get(packet.uuid);
        if (unit) {
            unit.updatePath(packet.start, packet.path);
        } else {
            this.requestUnit(packet.uuid);
        }
    }

    private handleUnitDied(packet: IDPacket): void {
        const unit = this.units.get(packet.uuid);
        if (unit) {
            unit.kill();
        }
    }

    private handleUnitDamaged(packet: DamagePacket): void {
        const defender = this.getUnit(packet.defender);
        const attacker = this.getUnit(packet.attacker);
        if (attacker) {
            attacker.animController.playOnce(UnitAnimation.PUNCH);
            attacker.lookAt(defender);
        }
        if (defender) {
            defender.data.health -= packet.damage;
            defender.animController.playOnce(UnitAnimation.FLINCH);
            defender.lookAt(attacker);
        }

        this.emit('damaged', this, packet);
    }

    private requestUnit(uuid: string): void {
        NetClient.send(PacketHeader.UNIT_REQUEST, <IDPacket>{
            uuid,
        });
    }

    public getUnit(uuid: string): Unit {
        return this.units.get(uuid);
    }

    public addUnit(unit: Unit): void {
        this.units.set(unit.data.id, unit);
        this.emit('added', this, unit);

        unit.on('death', (self: Unit) => {
            this.units.delete(self.data.id);
            self.dispose();
        });
    }

    private tick(world: World, tick: number): void {
        for (const [_, unit] of this.units) {
            unit.tick();
        }
    }

    public update(delta: number): void {
        for (const [_, u] of this.units) {
            u.update(delta);
        }
    }
}
