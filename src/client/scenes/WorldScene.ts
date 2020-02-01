import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import { InventoryType } from '../../common/InventoryDef';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/components/Button';
import SceneManager from '../engine/scene/SceneManager';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import UIParent from '../engine/interface/components/UIParent';
import World from '../engine/World';
import Input from '../engine/Input';
import Label from '../engine/interface/components/Label';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, ChatMsgPacket, WorldInfoPacket, DamagePacket, InventorySwapPacket, InventoryUsePacket, InventoryPacket, ResponsePacket, InventoryDropPacket, SkillsPacket,
} from '../../common/Packet';
import Chatbox from '../engine/interface/Chatbox';
import ChatHoverMessage from '../engine/interface/components/ChatHoverMessage';
import { WorldPoint } from '../../common/Point';
import LocalUnit, { UnitAnimation } from '../engine/LocalUnit';
import UnitNameplate from '../engine/interface/UnitNameplate';
import HitSplat from '../engine/interface/HitSplat';
import BagsTab, { InventorySlot } from '../engine/interface/tabs/BagsTab';
import SkillsTab from '../engine/interface/tabs/SkillsTab';
import TabContainer from '../engine/interface/TabContainer';
import Rectangle from '../../common/Rectangle';
import Engine from '../engine/Engine';

const nameplateTimeout = 10;

export default class WorldScene extends GameScene {
    private world: World;
    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;
    private lblSceneCount: Label;
    private mousePoint: WorldPoint;
    private intersects: THREE.Intersection[] = [];
    private wireframesVisible: boolean = false;
    private chatbox: Chatbox;
    private chatHoverMsgs: ChatHoverMessage[] = [];
    private nameplates: Map<string, UnitNameplate> = new Map();
    private hitsplats: Map<string, HitSplat> = new Map();
    private tabContainer: TabContainer;

    public constructor() {
        super('world');
    }

    private initGUITabs(): void {
        const tabIconSize = 30;
        this.tabContainer = new TabContainer(UIParent.get(), 320, 320);

        const bagsTab = new BagsTab(this.tabContainer);
        this.tabContainer.addTab(bagsTab, new Rectangle(tabIconSize * 2, tabIconSize * 0, tabIconSize, tabIconSize));
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
        this.tabContainer.addTab(skillsTab, new Rectangle(tabIconSize * 1, tabIconSize * 2, tabIconSize, tabIconSize));
        NetClient.on(PacketHeader.PLAYER_SKILLS, (packet: SkillsPacket) => {
            skillsTab.setSkills(packet.skills);
        });
    }

    private initGUI(): void {
        Engine.addFpsLabel();

        // build back button
        const btnBack = new Button(UIParent.get(), 'Back');
        btnBack.style.position = 'fixed';
        btnBack.style.margin = '5px 10px';
        btnBack.style.display = 'block';
        btnBack.style.width = '120px';
        btnBack.style.top = '5px';
        btnBack.style.right = '0';
        btnBack.addEventListener('click', () => {
            NetClient.send(PacketHeader.PLAYER_LEAVEWORLD);
            SceneManager.changeScene('char-select');
        });

        this.lblMouseWorld = new Label(UIParent.get(), 'World: { X, Y, Z }');
        this.lblMouseWorld.style.position = 'fixed';
        this.lblMouseWorld.style.top = '15px';
        this.lblMouseWorld.style.left = '0';

        this.lblMouseTile = new Label(UIParent.get(), 'Tile: { X, Y }');
        this.lblMouseTile.style.position = 'fixed';
        this.lblMouseTile.style.top = '30px';
        this.lblMouseTile.style.left = '0';

        this.lblMouseChunk = new Label(UIParent.get(), 'Chunk: { X, Y }');
        this.lblMouseChunk.style.position = 'fixed';
        this.lblMouseChunk.style.top = '45px';
        this.lblMouseChunk.style.left = '0';

        this.lblSceneCount = new Label(UIParent.get(), 'Scene Count: ?');
        this.lblSceneCount.style.position = 'fixed';
        this.lblSceneCount.style.top = '60px';
        this.lblSceneCount.style.left = '0';

        this.chatbox = new Chatbox(UIParent.get(), 400, 200);
        this.chatbox.style.left = '0';
        this.chatbox.style.bottom = '0';
        this.chatbox.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.chatbox.onMessageSend = (message: string) => {
            NetClient.send(PacketHeader.CHAT_EVENT, <ChatMsgPacket>{ message });
        };
        NetClient.on(PacketHeader.CHAT_EVENT, (p: ChatMsgPacket) => {
            this.chatbox.addChatMessage(p);
            this.chatHoverMsgs.push(new ChatHoverMessage(this.world, this.camera, p));
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
        // this.world.on('unitAdded', this.createNameplate.bind(this));
        this.world.on('unitRemoved', this.disposeNameplate.bind(this));
    }

    private initSplats(): void {
        NetClient.on(PacketHeader.UNIT_DAMAGED, (packet: DamagePacket) => {
            const defender = this.world.getUnit(packet.defender);
            const attacker = this.world.getUnit(packet.attacker);
            if (attacker) {
                attacker.animPlayOnce(UnitAnimation.PUNCH);
                attacker.lookAt(defender);
            }
            if (defender) {
                this.createNameplate(defender);
                defender.animPlayOnce(UnitAnimation.FLINCH);
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

    public async init(): Promise<void> {
        this.initGUI();
        this.initGUITabs();

        this.scene = new Scene();

        // TODO: lights in world/chunk def
        const light = new THREE.HemisphereLight(0xffffff, 0x3d394d, 1.5);
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

        super.init();
    }

    public final(): void {
        super.final();
    }

    private updateMousePoint(): void {
        const intersects = this.camera.rcast(this.scene, Input.mousePos(), true);
        let found = false;
        for (const int of intersects) {
            if (int.object.name === 'terrain') {
                this.mousePoint = new WorldPoint(int.point, this.world.chunkWorld);
                this.intersects = intersects;
                found = true;
                break;
            }
        }
        if (!found) {
            this.mousePoint = null;
            this.intersects = [];
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

    public update(delta: number): void {
        this.updateMousePoint();
        this.updateTopLeftLabels();
        this.updateWireframesToggle();
        this.updateChatHoverMsgs();
        this.updateNameplates();
        this.updateHitSplats();

        if (this.world.player.data) {
            this.camera.setTarget(this.world.player.getWorldPosition() || new THREE.Vector3(0, 0, 0));
        }
        this.camera.update(delta);
        this.world.update(delta, this.mousePoint, this.intersects);
    }

    public draw(): void {
        super.draw();
    }
}
