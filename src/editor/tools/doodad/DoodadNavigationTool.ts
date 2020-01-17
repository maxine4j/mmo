import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import BaseDoodadTool from './BaseDoodadTool';
import Point from '../../../common/Point';
import Input, { MouseButton } from '../../../client/engine/Input';
import Doodad from '../../../client/engine/Doodad';
import CheckBoxProp from '../../panelprops/CheckboxProp';

class Navblock {
    public mesh: THREE.Mesh;
    public position: Point; // position of the navblock relative to the doodad
    public doodad: Doodad;
    public props: EditorProps;

    public constructor(pos: Point, doodad: Doodad, props: EditorProps, ontop: boolean) {
        this.position = pos;
        this.doodad = doodad;
        this.props = props;

        const geometry = new THREE.BoxGeometry(0.9, 0.1, 0.9);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            opacity: 0.5,
            transparent: true,
        });
        if (ontop) {
            material.depthTest = false;
        }
        this.mesh = new THREE.Mesh(geometry, material);
        if (ontop) {
            this.mesh.renderOrder = 999;
        }
        this.positionInWorld();
    }

    public get absolutePos(): Point { // position of the navblock in chunk space
        return new Point(this.doodad.def.x + this.position.x, this.doodad.def.y + this.position.y);
    }

    public positionInWorld(): void {
        const tilePos = this.props.world.chunkToTile(this.props.chunk.chunk, this.absolutePos);
        const worldPos = this.props.world.tileToWorld(tilePos);
        this.mesh.position.copy(worldPos);
    }

    public addToScene(): void {
        this.props.scene.add(this.mesh);
    }

    public removeFromScene(): void {
        this.props.scene.remove(this.mesh);
    }
}

export default class DoodadNavigationTool extends BaseDoodadTool {
    private navblocks: Navblock[] = [];
    private toolSelected: boolean = false;
    private renderOnTop: boolean = false;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super('doodad-navigation', 'assets/icons/doodad_navigation.png', props, panel);

        const renderOnTopProp = new CheckBoxProp(this.propsPanel, 'Render On Top:',
            (val) => {
                this.renderOnTop = val;
                this.generateNavblocks();
            });
        this.propsPanel.addProp(renderOnTopProp);

        this.props.onSelectedDoodadChanged.push((doodad) => {
            if (this.toolSelected) {
                this.generateNavblocks();
            }
        });
    }

    public onSelected(): void {
        super.onSelected();
        this.toolSelected = true;
        this.generateNavblocks();
    }

    public onUnselected(): void {
        super.onUnselected();
        this.toolSelected = false;
        this.navblocks.forEach((nb) => nb.removeFromScene());
    }

    private generateNavblocks(): void {
        if (this.props.selectedDoodad) {
            // clear old nav blocks
            this.navblocks.forEach((nb) => nb.removeFromScene());
            this.navblocks = [];
            // make new ones
            for (const nbd of this.props.selectedDoodad.def.navblocks) {
                const pos = new Point(nbd.x, nbd.y);
                const navblock = new Navblock(pos, this.props.selectedDoodad, this.props, this.renderOnTop);
                this.navblocks.push(navblock);
                navblock.addToScene();
            }
        }
    }

    private getNavblockDefIdx(chunkPos: Point): number {
        if (this.props.selectedDoodad) {
            const doodadPos = new Point(chunkPos.x - this.props.selectedDoodad.def.x, chunkPos.y - this.props.selectedDoodad.def.y);
            for (let i = 0; i < this.props.selectedDoodad.def.navblocks.length; i++) {
                const nb = this.props.selectedDoodad.def.navblocks[i];
                if (nb.x === doodadPos.x && nb.y === doodadPos.y) {
                    return i;
                }
            }
        }
        return -1;
    }

    private removeNavblock(chunkPos: Point): boolean {
        if (this.props.selectedDoodad) {
            const idx = this.getNavblockDefIdx(chunkPos);
            if (idx === -1) {
                return false; // didnt find a navblock to remove
            }
            this.props.selectedDoodad.def.navblocks.splice(idx, 1); // remove the block at idx
            this.generateNavblocks();
            return true; // found a navblock and removed it
        }
        return false;
    }

    private addNavblock(chunkPos: Point): void {
        if (this.props.selectedDoodad && this.getNavblockDefIdx(chunkPos) === -1) {
            const doodadPos = new Point(chunkPos.x - this.props.selectedDoodad.def.x, chunkPos.y - this.props.selectedDoodad.def.y);
            this.props.selectedDoodad.def.navblocks.push({
                x: doodadPos.x,
                y: doodadPos.y,
            });
            this.generateNavblocks();
        }
    }

    private toggleNav(chunkPos: Point): void {
        if (this.props.selectedDoodad) {
            if (!this.removeNavblock(chunkPos)) {
                this.addNavblock(chunkPos);
            }
        }
    }

    public doodadUse(delta: number): void {
        if (Input.isKeyDown(Key.Shift)) {
            this.addNavblock(this.props.point.chunk);
        } else if (Input.isKeyDown(Key.Alt)) {
            this.removeNavblock(this.props.point.chunk);
        }
    }

    public update(delta: number): void {
        super.update(delta);

        if (Input.wasMousePressed(MouseButton.LEFT) && !Input.isKeyDown(Key.Control)
            && !Input.isKeyDown(Key.Alt) && !Input.isKeyDown(Key.Shift)) {
            this.toggleNav(this.props.point.chunk);
        }
    }
}
