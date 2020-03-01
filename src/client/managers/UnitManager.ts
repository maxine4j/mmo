import { EventEmitter } from 'events';
import CharacterDef from '../../common/definitions/CharacterDef';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, IDPacket, DamagePacket, UnitPacket,
} from '../../common/Packet';
import Unit, { UnitAnimation } from '../models/Unit';
import World from '../models/World';
import Player from '../models/Player';

type UnitManagerEvent = 'added' | 'removed' | 'damaged';

declare interface UnitManager {
    emit(event: 'added', self: UnitManager, unit: Unit): boolean;
    emit(event: 'removed', self: UnitManager, unit: Unit): boolean;
    emit(event: 'damaged', self: UnitManager, packet: DamagePacket): boolean;

    on(event: 'added', listener: (self: UnitManager, unit: Unit) => void): this;
    on(event: 'removed', listener: (self: UnitManager, unit: Unit) => void): this;
    on(event: 'damaged', listener: (self: UnitManager, packet: DamagePacket) => void): this;
}

class UnitManager extends EventEmitter {
    private world: World;
    private units: Map<string, Unit> = new Map();

    public constructor(world: World) {
        super();

        this.world = world;
        this.world.on('tick', this.tick.bind(this));

        NetClient.on(PacketHeader.UNIT_ADDED, this.handleUnitAdded.bind(this));
        NetClient.on(PacketHeader.UNIT_REMOVED, this.handleUnitRemoved.bind(this));
        NetClient.on(PacketHeader.UNIT_UPDATED, this.handleUnitUpdated.bind(this));
        NetClient.on(PacketHeader.UNIT_DIED, this.handleUnitDied.bind(this));
        NetClient.on(PacketHeader.UNIT_DAMAGED, this.handleUnitDamaged.bind(this));
    }

    private handleUnitAdded(packet: UnitPacket): void {
        let unit: Unit;
        if (packet.unit.isPlayer) {
            unit = new Player(this.world, <CharacterDef>packet.unit);
        } else {
            unit = new Unit(this.world, packet.unit);
        }
        unit.updatePath(packet.start, packet.path);
        this.addUnit(unit);
    }

    private handleUnitRemoved(packet: IDPacket): void {
        const unit = this.getUnit(packet.uuid);
        if (unit != null) {
            this.removeUnit(unit);
        }
    }

    private handleUnitUpdated(packet: UnitPacket): void {
        const unit = this.units.get(packet.unit.uuid);
        if (unit) {
            unit.data = packet.unit;
            unit.updatePath(packet.start, packet.path);
        } else {
            this.handleUnitAdded(packet);
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

    private removeUnit(unit: Unit): void {
        unit.dispose();
        this.units.delete(unit.data.uuid);
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

export default UnitManager;
