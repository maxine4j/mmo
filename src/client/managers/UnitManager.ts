import { TypedEmitter } from '../../common/TypedEmitter';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, PathPacket, UnitPacket, IDPacket, DamagePacket, UnitAddPacket,
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
        NetClient.on(PacketHeader.UNIT_PATHED, this.handleUnitPathed.bind(this));
        NetClient.on(PacketHeader.UNIT_UPDATED, this.handleUnitUpdated.bind(this));
        NetClient.on(PacketHeader.UNIT_DIED, this.handleUnitDied.bind(this));
        NetClient.on(PacketHeader.UNIT_DAMAGED, this.handleUnitDamaged.bind(this));
    }

    private handleUnitAdded(packet: UnitAddPacket): void {
        const unit = new Unit(this.world, packet.unit);
        unit.updatePath(packet.start, packet.path);
        this.addUnit(unit);
    }

    private handleUnitUpdated(packet: IDPacket): void {
        const unit = this.units.get(packet.uuid);
        if (!unit) {
            this.requestUnit(packet.uuid);
        }
    }

    private handleUnitPathed(packet: PathPacket): void {
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
        this.units.set(unit.data.uuid, unit);
        this.emit('added', this, unit);

        unit.on('death', (self: Unit) => {
            this.emit('removed', this, self);
            this.units.delete(self.data.uuid);
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
