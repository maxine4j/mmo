/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
import * as THREE from 'three';
import UIParent from '../../../client/engine/interface/components/UIParent';
import Tool from '../../Tool';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import Chunk from '../../../client/models/Chunk';
import Graphics from '../../../client/engine/graphics/Graphics';
import ContextMenu from '../../../client/engine/interface/components/ContextMenu';
import ButtonProp from '../../panelprops/ButtonProp';

const outlineThickness = 8;
const outlineStrength = 20;
const deleteColor = new THREE.Color(0xff0000);
const createColor = new THREE.Color(0x00ff00);
const hoverColor = new THREE.Color(0xffff00);

export interface PhantomChunk {
    x: number;
    y: number;
    mesh: THREE.Mesh;
    exisiting: Chunk;
}

export default class ChunkTool extends Tool {
    private phantoms: PhantomChunk[] = [];
    private _selectedChunk: PhantomChunk;
    private menu: ContextMenu;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'chunk',
            '- Create or delete chunks.\n',
            'assets/icons/chunk_overview.png',
            props, panel,
        );
        this.menu = new ContextMenu(UIParent.get());
    }

    private updatePropsPanel(): void {
        this.propsPanel.clear();
        if (this.selectedChunk) {
            if (this.selectedChunk.exisiting) {
                this.propsPanel.addProp(new ButtonProp(this.propsPanel, 'Delete Selected Chunk',
                    () => {
                        if (confirm('Are you sure you want to delete the selected chunk?')) {
                            this.deleteSelectedChunk();
                        }
                    }));
            } else {
                this.propsPanel.addProp(new ButtonProp(this.propsPanel, 'Create Chunk',
                    async () => { await this.createSelectedChunk(); }));
            }
        }
    }

    private async createSelectedChunk(): Promise<void> {
        if (this.selectedChunk && !this.selectedChunk.exisiting) {
            await this.props.world.createNewChunk(this.selectedChunk.x, this.selectedChunk.y);
            this.selectedChunk = null;
            this.hidePhantomChunks();
            this.showPhantomChunks();
        }
    }

    private deleteSelectedChunk(): void {
        if (this.selectedChunk && this.selectedChunk.exisiting) {
            this.props.world.deleteChunk(this.selectedChunk.x, this.selectedChunk.y);
            this.selectedChunk = null;
            this.props.selectedDoodad = null;
            this.hidePhantomChunks();
            this.showPhantomChunks();
        }
    }

    public showPhantomChunks(): void {
        let minX = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        for (const [_x, _y, chunk] of this.props.world.chunks) {
            if (chunk.def.x < minX) minX = chunk.def.x;
            if (chunk.def.x > maxX) maxX = chunk.def.x;
            if (chunk.def.y < minY) minY = chunk.def.y;
            if (chunk.def.y > maxY) maxY = chunk.def.y;
        }

        for (let y = minY - 1; y < maxY + 2; y++) {
            for (let x = minX - 1; x < maxX + 2; x++) {
                const phantom = <PhantomChunk>{
                    x,
                    y,
                    mesh: new THREE.Mesh(
                        new THREE.BoxGeometry(this.props.world.chunkSize, this.props.world.chunkSize, this.props.world.chunkSize),
                        new THREE.MeshPhongMaterial({ color: 0xFFFFFF, opacity: 0.5, transparent: true }),
                    ),
                    exisiting: this.props.world.chunks.get(x, y),
                };
                phantom.mesh.position.set(x * this.props.world.chunkSize, 0, y * this.props.world.chunkSize);
                phantom.mesh.name = 'phantom';
                phantom.mesh.userData = {
                    phantomChunk: phantom,
                };
                this.props.scene.add(phantom.mesh);
                this.phantoms.push(phantom);
            }
        }
    }

    public hidePhantomChunks(): void {
        for (const phantom of this.phantoms) {
            this.props.scene.remove(phantom.mesh);
        }
        this.phantoms = [];
    }


    public onSelected(): void {
        super.onSelected();
        this.props.camera.chunkOverviewMode = true;
        this.showPhantomChunks();
    }

    public onUnselected(): void {
        super.onUnselected();
        this.props.camera.chunkOverviewMode = false;
        this.hidePhantomChunks();
    }

    private get selectedChunk(): PhantomChunk { return this._selectedChunk; }
    private set selectedChunk(chunk: PhantomChunk) {
        this._selectedChunk = chunk;
        this.updatePropsPanel();
    }

    private openContextMenu(showCreate: boolean, showDelete: boolean): void {
        this.menu.clear();
        if (showCreate) {
            this.menu.addOption({
                text: 'Create',
                listener: async () => {
                    await this.createSelectedChunk();
                },
            });
        }
        if (showDelete) {
            this.menu.addOption({
                text: 'Delete',
                listener: () => {
                    if (confirm('Are you sure you want to delete the selected chunk?')) {
                        this.deleteSelectedChunk();
                    }
                },
            });
        }
        this.menu.open(Input.mousePos());
    }

    public update(delta: number): void {
        super.update(delta);
        let hoverChunk: PhantomChunk;
        for (const int of this.props.camera.rcast(this.props.scene.children, Input.mousePos())) {
            if (int.object.name === 'phantom') {
                hoverChunk = <PhantomChunk>int.object.userData.phantomChunk;
                if (Input.wasMousePressed(MouseButton.LEFT)) {
                    this.selectedChunk = hoverChunk;
                }
                if (Input.wasMousePressed(MouseButton.RIGHT)) {
                    this.selectedChunk = hoverChunk;
                    this.openContextMenu(this.selectedChunk.exisiting == null, this.selectedChunk.exisiting != null);
                }
                break;
            }
        }
        if (this.selectedChunk && this.selectedChunk.mesh) {
            if (this.selectedChunk.exisiting) {
                Graphics.setOutlines([this.selectedChunk.mesh], deleteColor, outlineThickness, outlineStrength);
            } else {
                Graphics.setOutlines([this.selectedChunk.mesh], createColor, outlineThickness, outlineStrength);
            }
        } else if (hoverChunk && hoverChunk.mesh) {
            Graphics.setOutlines([hoverChunk.mesh], hoverColor, outlineThickness, outlineStrength);
        }
    }
}
