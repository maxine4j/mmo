import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import uuid from 'uuid/v4';
import Tool from '../../Tool';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import Graphics from '../../../client/engine/graphics/Graphics';
import { Point } from '../../../common/Point';
import DoodadMoveTool from './DoodadMoveTool';
import { DoodadDef } from '../../../common/definitions/ChunkDef';
import Doodad from '../../../client/engine/Doodad';
import LibraryProp, { BookCover } from '../../panelprops/LibraryProp';
import { contentDef } from '../../EditorScene';
import { ModelAssetDef } from '../../../client/engine/asset/AssetDef';
import AssetManager from '../../../client/engine/asset/AssetManager';

const iconResolution = 64;

enum DoodadToolMode {
    PLACE,
    POSITION,
    ROTATE,
    ELEVATION,
}

export default class DoodadAddTool extends Tool {
    private mode: DoodadToolMode;
    private mouseStart: Point;
    private intialTheta: number;
    private initialElevation: number;
    private librarySelectedModelID: string;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-add',
            '- Place the selected doodad in the world with left click.\n'
            + '- Control + left click to move the placed doodad.\n'
            + '- Alt + left click to rotate the placed doodad (Alt+Shift for snapping).\n'
            + '- Shift + left click to adjust the placed doodad\'s elevation.',
            'assets/icons/doodad_add.png',
            props, panel,
        );

        this.loadLibrary();
    }

    private renderIcon(modelDef: ModelAssetDef, renderer: THREE.WebGLRenderer, camera: THREE.Camera, scene: THREE.Scene): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            // load the 3d model
            AssetManager.getModel(modelDef.id)
                .then((model) => {
                    // scale the model to fit nicely within the camera
                    const aabb = new THREE.Box3().setFromObject(model.obj);
                    const dx = aabb.max.x - aabb.min.x;
                    const dy = aabb.max.y - aabb.min.y;
                    const dz = aabb.max.z - aabb.min.z;
                    const maxDiff = Math.max(dx, dy, dz);
                    const mscale = (1 / maxDiff);
                    model.obj.scale.set(mscale, mscale, mscale);

                    // render the scene
                    scene.add(model.obj);
                    renderer.render(scene, camera);

                    // clean up
                    scene.remove(model.obj);
                    model.dispose();

                    // image tag to give to the book cover
                    const img = document.createElement('img');
                    img.addEventListener('load', () => {
                        resolve(img);
                    });
                    img.src = renderer.domElement.toDataURL(); // save the rendered scene to an image tag
                })
                .catch((err) => reject(err));
        });
    }

    private async loadLibrary(): Promise<void> {
        // create a separate renderer to render our icons
        const vpw = iconResolution;
        const vph = iconResolution;
        const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
        // renderer.setClearColor(0x00ff00);
        renderer.setClearColor(0x87CEEB);
        renderer.setSize(vpw, vph);

        // create a camera and scene used to render our icons
        const camera = new THREE.PerspectiveCamera(45, vpw / vph, 0.1, 100);
        camera.position.set(2, 1, 1);
        camera.lookAt(0, 0.5, 0);
        const scene = new THREE.Scene();
        const light = new THREE.AmbientLight(0xFFFFFF, 2);
        scene.add(light);

        // render icons
        const iconPromies: Promise<HTMLImageElement>[] = [];
        const modelDefs: ModelAssetDef[] = [];
        for (const id in contentDef.content.models) {
            const def = contentDef.content.models[id];
            modelDefs.push(def);
            iconPromies.push(this.renderIcon(def, renderer, camera, scene));
        }
        const icons = await Promise.all(iconPromies);

        // clean up
        scene.dispose();
        renderer.dispose();

        // create items
        const items: { item: ModelAssetDef, cover: BookCover }[] = [];
        for (let i = 0; i < icons.length; i++) {
            const def = modelDefs[i];
            const icon = icons[i];
            items.push({
                item: def,
                cover: {
                    name: def.id,
                    icon,
                },
            });
        }

        // create the library
        const library = new LibraryProp<ModelAssetDef>(
            this.propsPanel,
            items,
            (item) => {
                this.librarySelectedModelID = item.id;
            },
        );
        this.propsPanel.addProp(library);
    }

    private usePosition(): void {
        const chunkPoint = this.props.point.toChunk();

        // check if we need to transfer the doodad to another chunk
        const oldChunk = this.props.selectedDoodad.chunk;
        const newChunk = chunkPoint.chunk;
        if (oldChunk.def.id !== newChunk.def.id) {
            DoodadMoveTool.transferDoodad(this.props.selectedDoodad.def.uuid, oldChunk, newChunk);
        }

        this.props.selectedDoodad.def.x = chunkPoint.x;
        this.props.selectedDoodad.def.y = chunkPoint.y;
    }

    private useRotate(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.rotation = Graphics.normaliseRadians(this.intialTheta + mouseDelta.x / 100);
        // snapping
        if (Input.isKeyDown(Key.Shift)) {
            this.props.selectedDoodad.def.rotation = Graphics.snapAngle(this.props.selectedDoodad.def.rotation, 8);
        }
    }

    private useElevation(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.elevation = this.initialElevation - mouseDelta.y / 100;
    }

    private placeDoodad(): void {
        if (this.librarySelectedModelID != null) {
            // make a new doodad and place it at the mouse point
            // select the dooddad
            const chunkPoint = this.props.point.toChunk();
            const chunk = chunkPoint.chunk;

            const def = <DoodadDef>{
                uuid: uuid(),
                elevation: 0,
                rotation: 0,
                scale: 1,
                walkable: false,
                navblocks: [],
                model: this.librarySelectedModelID,
                x: chunkPoint.x,
                y: chunkPoint.y,
            };
            chunk.def.doodads.push(def); // save the doodad to the chunk def so it exports

            Doodad.load(def, chunk).then((doodad) => {
                // add the doodad the the world and position it
                chunk.doodads.set(doodad.def.uuid, doodad);
                doodad.positionInWorld();
                this.props.selectedDoodad = doodad; // select it so we can further edit
            });
        }
    }

    public use(delta: number): void {
        if (this.props.selectedDoodad) {
            switch (this.mode) {
            case DoodadToolMode.POSITION: this.usePosition(); break;
            case DoodadToolMode.ROTATE: this.useRotate(); break;
            case DoodadToolMode.ELEVATION: this.useElevation(); break;
            default: break;
            }
            this.props.selectedDoodad.positionInWorld();
        }
    }

    public update(delta: number): void {
        this.mode = DoodadToolMode.PLACE; // default to place

        // get mode from modifier keys
        if (Input.isKeyDown(Key.Control)) {
            this.mode = DoodadToolMode.POSITION;
        } else if (Input.isKeyDown(Key.Alt)) {
            this.mode = DoodadToolMode.ROTATE;
        } else if (Input.isKeyDown(Key.Shift)) {
            this.mode = DoodadToolMode.ELEVATION;
        }

        // handle select
        if (this.mode === DoodadToolMode.PLACE && Input.wasMousePressed(MouseButton.LEFT)) {
            this.placeDoodad();
        }

        // handle rotation initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.props.selectedDoodad) {
                this.intialTheta = this.props.selectedDoodad.def.rotation;
                this.initialElevation = this.props.selectedDoodad.def.elevation;
            }
        }
    }
}
