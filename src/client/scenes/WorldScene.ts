import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import { skillName, expToLevel } from '../../common/CharacterDef';
import { InventoryType } from '../../common/InventoryDef';
import GameScene from '../engine/scene/GameScene';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import UIParent from '../engine/interface/components/UIParent';
import World from '../engine/World';
import Input from '../engine/Input';
import Label from '../engine/interface/components/Label';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, ChatMsgPacket, WorldInfoPacket, DamagePacket, InventorySwapPacket, InventoryUsePacket,
    InventoryPacket, ResponsePacket, InventoryDropPacket, SkillsPacket, ExpDropPacket, LevelupPacket, BooleanPacket,
} from '../../common/Packet';
import Chatbox from '../engine/interface/Chatbox';
import ChatHoverMessage from '../engine/interface/components/ChatHoverMessage';
import { WorldPoint, TilePoint } from '../../common/Point';
import LocalUnit, { UnitAnimation } from '../engine/LocalUnit';
import UnitNameplate from '../engine/interface/UnitNameplate';
import HitSplat from '../engine/interface/HitSplat';
import BagsTab, { InventorySlot } from '../engine/interface/tabs/BagsTab';
import SkillsTab from '../engine/interface/tabs/SkillsTab';
import TabContainer from '../engine/interface/TabContainer';
import Engine from '../engine/Engine';
import Minimap from '../engine/interface/Minimap';
import MinimapOrb from '../engine/interface/MinimapOrb';
import LogoutTab from '../engine/interface/tabs/LogoutTab';
import LocalGroundItem from '../engine/LocalGroundItem';

const nameplateTimeout = 10;

export default class WorldScene extends GameScene {
    private world: World;
    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;
    private lblSceneCount: Label;
    private lblTips: Label;
    private mousePoint: WorldPoint;
    private intersects: THREE.Intersection[] = [];
    private wireframesVisible: boolean = false;
    private chatbox: Chatbox;
    private chatHoverMsgs: ChatHoverMessage[] = [];
    private nameplates: Map<string, UnitNameplate> = new Map();
    private hitsplats: Map<string, HitSplat> = new Map();
    private tabContainer: TabContainer;
    private minimap: Minimap;
    private hpOrb: MinimapOrb;

    public constructor() {
        super('world');
    }

    private initGUITabs(): void {
        this.tabContainer = new TabContainer(UIParent.get(), 320, 320);

        const bagsTab = new BagsTab(this.tabContainer);
        this.tabContainer.addTab(bagsTab, 'backpack');
        bagsTab.on('swap', (a: InventorySlot, b: InventorySlot) => {
            NetClient.send(PacketHeader.INVENTORY_SWAP, <InventorySwapPacket>{
                slotA: a.slot,
                slotB: b.slot,
            });
        });
        bagsTab.on('use', (a: InventorySlot, b: InventorySlot) => {
            NetClient.sendRecv(PacketHeader.INVENTORY_USE, <InventoryUsePacket>{
                slotA: a.slot,
                slotB: b.slot,
            }).then((resp: ResponsePacket) => {
                this.chatbox.addRawMessage(resp.message);
            });
        });
        bagsTab.on('drop', (s: InventorySlot) => {
            NetClient.sendRecv(PacketHeader.INVENTORY_DROP, <InventoryDropPacket>{
                slot: s.slot,
            }).then((resp: ResponsePacket) => {
                if (resp) {
                    s.item = null;
                }
            });
        });
        NetClient.on(PacketHeader.INVENTORY_FULL, (packet: InventoryPacket) => {
            if (packet.type === InventoryType.BAGS) {
                bagsTab.loadDef(packet);
            }
        });

        const skillsTab = new SkillsTab(this.tabContainer);
        this.tabContainer.addTab(skillsTab, 'skills');
        NetClient.on(PacketHeader.PLAYER_SKILLS, (packet: SkillsPacket) => {
            skillsTab.setSkills(packet.skills);
        });

        const logoutTab = new LogoutTab(this.tabContainer);
        this.tabContainer.addTab(logoutTab, 'logout');
    }

    private initGUI(): void {
        Engine.addFpsLabel();

        let lastOffset = 50;
        const sep = 15;

        const initLbl = (s: string): Label => {
            const lbl = new Label(UIParent.get(), s);
            lbl.style.position = 'fixed';
            lbl.style.top = `${lastOffset}px`; lastOffset += sep;
            lbl.style.left = '0';
            return lbl;
        };
        this.lblMouseWorld = initLbl('World: { X, Y, Z }');
        this.lblMouseTile = initLbl('Tile: { X, Y }');
        this.lblMouseChunk = initLbl('Chunk: { X, Y }');
        this.lblSceneCount = initLbl('Scene Count: ?');
        this.lblTips = initLbl(' ');
        this.lblTips = initLbl('--- Keybinds ---');
        this.lblTips = initLbl('Reposition Doodads: <P>');
        this.lblTips = initLbl('Teleport To Mouse: <T>');
        this.lblTips = initLbl('Chat: <Enter>');
        this.lblTips = initLbl('Camera: <W/A/S/D>');

        this.chatbox = new Chatbox(UIParent.get(), 400, 200);
        this.chatbox.style.left = '0';
        this.chatbox.style.bottom = '0';
        this.chatbox.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.chatbox.onMessageSend = (message: string) => {
            if (message === '/tpm') {
                const tilePoint = this.mousePoint.toTile();
                if (tilePoint.toChunk().chunk) {
                    NetClient.send(PacketHeader.CHAT_EVENT, <ChatMsgPacket>{
                        message: `/tp ${tilePoint.x} ${tilePoint.y}`,
                    });
                    return;
                }
            }
            NetClient.send(PacketHeader.CHAT_EVENT, <ChatMsgPacket>{ message });
        };
        NetClient.on(PacketHeader.CHAT_EVENT, (p: ChatMsgPacket) => {
            this.chatbox.addChatMessage(p);
            this.chatHoverMsgs.push(new ChatHoverMessage(this.world, this.camera, p));
        });

        NetClient.on(PacketHeader.PLAYER_EXP_DROP, (p: ExpDropPacket) => {
            if (p.amount > 0) {
                // TODO: replace this with exp drop popups next to minimap
                this.chatbox.addRawMessage(`Gained ${p.amount} experience in ${skillName(p.skill)}`);
            }
        });

        NetClient.on(PacketHeader.PLAYER_LEVELUP, (p: LevelupPacket) => {
            this.chatbox.addRawMessage(`You have advanced a level in ${skillName(p.id)}. You are now level ${expToLevel(p.experience)}!`);
        });
    }

    private createNameplate(unit: LocalUnit): void {
        const existing = this.nameplates.get(unit.data.id);
        if (existing == null) {
            const np = new UnitNameplate(this.world, this.camera, unit);
            this.nameplates.set(unit.data.id, np);
        } else {
            existing.lastTickUpdated = this.world.currentTick;
        }
    }

    private disposeNameplate(unit: LocalUnit): void {
        const plate = this.nameplates.get(unit.data.id);
        if (plate) plate.dispose();
        this.nameplates.delete(unit.data.id);
    }

    private initNameplates(): void {
        this.world.on('unitRemoved', this.disposeNameplate.bind(this));
    }

    private initSplats(): void {
        NetClient.on(PacketHeader.UNIT_DAMAGED, (packet: DamagePacket) => {
            const defender = this.world.getUnit(packet.defender);
            const attacker = this.world.getUnit(packet.attacker);
            if (attacker) {
                attacker.animController.playOnce(UnitAnimation.PUNCH);
                attacker.lookAt(defender);
            }
            if (defender) {
                this.createNameplate(defender);
                defender.animController.playOnce(UnitAnimation.FLINCH);
                defender.lookAt(attacker);
                const splat = new HitSplat(this.world, this.camera, defender, packet.damage);
                this.hitsplats.set(splat.id, splat);
                setTimeout(() => {
                    this.hitsplats.delete(splat.id);
                    splat.dispose();
                }, this.world.tickRate * 1000);
            }
        });
    }

    private initMinimap(): void {
        this.minimap = new Minimap(UIParent.get(), this.world);
        this.minimap.on('click', (self: Minimap, pos: TilePoint) => {
            this.world.player.moveTo(pos);
        });
        this.world.on('unitAdded', (unit: LocalUnit) => {
            this.minimap.trackUnit(unit);
        });
        this.world.on('unitRemoved', (unit: LocalUnit) => {
            this.minimap.untrackUnit(unit.data.id);
        });
        this.world.on('groundItemAdded', (gi: LocalGroundItem) => {
            this.minimap.trackGrounItem(gi);
        });
        this.world.on('groundItemRemoved', (gi: LocalGroundItem) => {
            this.minimap.untrackGroundItem(gi);
        });

        const runOrb = new MinimapOrb(this.minimap, this.world.player.data.running, -1, 'assets/imgs/orbs/orb_run.png');
        runOrb.on('click', (self: MinimapOrb, active: boolean) => {
            NetClient.send(PacketHeader.PLAYER_SET_RUN, <BooleanPacket>{
                value: active,
            });
        });
        this.minimap.addOrb(runOrb);


        const hpOrb = new MinimapOrb(this.minimap, false, this.world.player.data.health, 'assets/imgs/orbs/orb_hp.png', false);
        this.world.on('tick', () => {
            hpOrb.value = this.world.player.data.health;
        });
        this.minimap.addOrb(hpOrb);
    }

    public async init(): Promise<void> {
        this.initGUI();
        this.initGUITabs();

        this.scene = new Scene();

        // TODO: lights in world/chunk def
        const light = new THREE.HemisphereLight(0xffffff, 0x3d394d, 1);
        light.position.set(0, 50, 0);
        this.scene.add(light);

        const info = <WorldInfoPacket> await NetClient.sendRecv(PacketHeader.WORLD_INFO);
        this.world = new World(this.scene, info);

        const viewDist = info.chunkViewDist * info.chunkSize;
        this.camera = new Camera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, viewDist);
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);
        this.scene.fog = new THREE.Fog(Graphics.clearColor, viewDist - 20, viewDist);

        this.initNameplates();
        this.initSplats();
        this.initMinimap();

        super.init();
    }

    public final(): void {
        super.final();
    }

    private updateMousePoint(): void {
        this.intersects = this.camera.rcast(this.scene.children, Input.mousePos(), true);
        this.mousePoint = null;
        for (const int of this.intersects) {
            if (int.object.name === 'terrain') {
                this.mousePoint = new WorldPoint(int.point, this.world.chunkWorld);
                break;
            }
        }
    }

    private updateTopLeftLabels(): void {
        if (this.mousePoint) {
            const tileCoord = this.mousePoint.toTile();
            const chunkCoord = tileCoord.toChunk();
            this.lblMouseWorld.text = `World: { ${this.mousePoint.x.toFixed(2)}, ${this.mousePoint.y.toFixed(2)}, ${this.mousePoint.z.toFixed(2)} }`;
            if (tileCoord) this.lblMouseTile.text = `Tile: { ${tileCoord.x}, ${tileCoord.y} } elevation: ${(tileCoord.elevation || 0).toFixed(2)}`;
            if (chunkCoord) this.lblMouseChunk.text = `Chunk: { ${chunkCoord.x}, ${chunkCoord.y} } elevation: ${(chunkCoord.elevation || 0).toFixed(2)}`;
        } else {
            this.lblMouseWorld.text = 'World: { ?, ?, ? }';
            this.lblMouseTile.text = 'Tile: { ?, ? } elevation: ?';
            this.lblMouseChunk.text = 'Chunk: { ?, ? } elevation: ?';
        }
        this.lblSceneCount.text = `Scene Count: ${this.scene.children.length}`;
    }

    private updateWireframesToggle(): void {
        if (Input.wasKeyPressed(Key.Insert)) {
            this.wireframesVisible = !this.wireframesVisible;
            this.world.chunkWorld.setWireframeVisibility(this.wireframesVisible);
        }
        if (Input.wasKeyPressed(Key.Enter)) {
            this.chatbox.focus();
        }
    }

    private updateChatHoverMsgs(): void {
        this.chatHoverMsgs = this.chatHoverMsgs.filter((msg: ChatHoverMessage) => !msg.update());
    }

    private updateNameplates(): void {
        for (const [_, np] of this.nameplates) {
            np.update();
            if (np.lastTickUpdated + nameplateTimeout < this.world.currentTick) {
                this.disposeNameplate(np.unit);
            }
        }
    }

    private updateHitSplats(): void {
        for (const [_, splat] of this.hitsplats) {
            splat.update();
        }
    }

    private updateDebugKeys(): void {
        if (Input.wasKeyPressed('t') && this.mousePoint) {
            const tilePoint = this.mousePoint.toTile();
            if (tilePoint.toChunk().chunk) {
                NetClient.send(PacketHeader.CHAT_EVENT, <ChatMsgPacket>{
                    message: `/tp ${tilePoint.x} ${tilePoint.y}`,
                });
            }
        }

        if (Input.wasKeyPressed('p')) {
            for (const [_x, _y, chunk] of this.world.chunkWorld.chunks) {
                chunk.positionInWorld();
                chunk.positionDoodads();
            }
        }
    }

    public update(delta: number): void {
        this.updateMousePoint();
        this.updateTopLeftLabels();
        this.updateWireframesToggle();
        this.updateChatHoverMsgs();
        this.updateNameplates();
        this.updateHitSplats();

        this.updateDebugKeys();

        if (this.world.player.data) {
            this.camera.setTarget(this.world.player.getWorldPosition() || new THREE.Vector3(0, 0, 0));
        }
        this.camera.update(delta);
        this.world.update(delta, this.mousePoint, this.intersects);
    }

    public draw(): void {
        this.minimap.draw();
        super.draw();
    }
}
