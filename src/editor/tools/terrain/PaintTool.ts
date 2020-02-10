import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import SliderProp from '../../panelprops/SliderProp';
import { ChunkPoint } from '../../../common/Point';
import { ImageData3D } from '../../../client/engine/graphics/Texture';
import LibraryProp, { BookCover } from '../../panelprops/LibraryProp';
import { TerrainTextureAssetDef } from '../../../client/engine/asset/AssetDef';
import AssetManager, { contentDef } from '../../../client/engine/asset/AssetManager';
import Chunk from '../../../client/engine/Chunk';

const numLayers = 3;
const strideRGBA = 4;
const colourChannelMax = 255; // max uint8 - 1
const paintRate = 15;

// TODO: if a texture does not exist on a chunk we should add it when painting

export default class PaintTool extends Tool {
    private brush: Brush;
    public depth: number = 0;
    public strength: number = 1;

    private librarySelectedTerrainID: string;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'paint',
            '- Paint the selected texture onto the terrain.',
            'assets/icons/terrain_paint.png',
            props, panel,
        );
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);

        const strengthSlider = new SliderProp(this.propsPanel, 'Strength', 0, 1, 0.01, this.strength,
            (val) => {
                this.strength = val;
            });
        this.propsPanel.addProp(strengthSlider);

        this.loadLibrary();
    }

    private async loadLibrary(): Promise<void> {
        const defs: TerrainTextureAssetDef[] = [];
        const iconPromises: Promise<HTMLImageElement>[] = [];
        for (const id in contentDef.content.terrain) {
            const def = contentDef.content.terrain[id];
            defs.push(def);
            iconPromises.push(AssetManager.loadImage(def.diffuse));
        }
        const icons = await Promise.all(iconPromises);

        // create items
        const items: { item: TerrainTextureAssetDef, cover: BookCover }[] = [];
        for (let i = 0; i < icons.length; i++) {
            const def = defs[i];
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
        const library = new LibraryProp<TerrainTextureAssetDef>(
            this.propsPanel,
            items,
            (item) => {
                this.librarySelectedTerrainID = item.id;
            },
        );
        this.propsPanel.addProp(library);
    }

    public onSelected(): void {
        super.onSelected();
        this.brush.show();
    }

    public onUnselected(): void {
        super.onUnselected();
        this.brush.hide();
    }

    private setGreyscale(img: ImageData3D, layer: number, grey: number, x: number, y: number, w: number, h: number): void {
        const depthOffset = img.width * img.height * layer;

        const endx = x + w;
        const endy = y + h;
        for (let yi = y; yi < endy; yi++) {
            for (let xi = x; xi < endx; xi++) {
                const xyOffset = yi * img.width + xi;
                const idx = (depthOffset + xyOffset) * strideRGBA;
                let val = img.data[idx] + paintRate * grey;
                if (val > colourChannelMax) val = colourChannelMax;
                else if (val < 0) val = 0;
                img.data[idx] = val; // TODO: blend texture only needs one channel, remove GBA
            }
        }
    }

    public directDraw(point: ChunkPoint, layer: number, strength: number): void {
        const texture = point.chunk.material.texture.blend;
        const img = <ImageData3D>texture.image;

        const x = (point.x / point.chunk.size) * img.width;
        const y = (point.y / point.chunk.size) * img.height;
        const w = img.width / point.chunk.size; // width and height so we dont skip points
        const h = img.width / point.chunk.size; // when texture and chunk size dont match

        // paint the strength to the primary layer
        this.setGreyscale(img, layer, strength, x, y, w, h);

        // paint the inverse of the strength to the other layers
        for (let i = 0; i < img.depth; i++) {
            if (i !== layer) {
                this.setGreyscale(img, i, -strength, x, y, w, h);
            }
        }

        // flag the texture to be updated
        texture.needsUpdate = true;
    }

    private getLayerDepth(chunk: Chunk, layerID: string): number {
        // return the depth of the given layer id
        for (let i = 0; i < chunk.material.texture.layerIDs.length; i++) {
            if (chunk.material.texture.layerIDs[i] === layerID) {
                return i;
            }
        }
        return null;
    }

    public use(delta: number): void {
        for (const point of this.brush.pointsIn()) {
            const chunkPoint = point.toChunk();
            this.directDraw(chunkPoint, this.getLayerDepth(chunkPoint.chunk, this.librarySelectedTerrainID), this.strength);
        }
    }

    public update(delta: number): void {
        super.update(delta);
        this.brush.update();
    }
}
