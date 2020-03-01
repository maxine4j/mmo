import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import SliderProp from '../../panelprops/SliderProp';
import { ChunkPoint } from '../../../common/Point';
import LibraryProp, { BookCover } from '../../panelprops/LibraryProp';
import { TerrainTextureAssetDef } from '../../../client/engine/asset/AssetDef';
import { contentDef, loadImage, defaultBlendSize } from '../../../client/engine/asset/AssetManager';
import Chunk from '../../../client/engine/Chunk';
import { ChunkTexture } from '../../../common/definitions/ChunkDef';
import { ImageData3D } from '../../../client/engine/graphics/materials/TerrainMaterial';

const strideRGBA = 4;
const colourChannelMax = 255; // max uint8 - 1
const paintRate = 15;

export function generateTexture(w: number, h: number, fillStyle: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, w, h);
    return canvas.toDataURL();
}

export function getBlendMapData(chunk: Chunk): ChunkTexture[] {
    const img = <ImageData3D>chunk.material.texture.blend.image;
    const canvas = document.createElement('canvas'); // TODO: re use this
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    const layers: ChunkTexture[] = [];
    for (let layer = 0; layer < img.depth; layer++) {
        const imgData = new ImageData(img.width, img.height);
        const depthOffset = img.width * img.height * layer;
        for (let yi = 0; yi < img.height; yi++) {
            for (let xi = 0; xi < img.width; xi++) {
                const xyOffset = yi * img.width + xi;
                const srcIdx = (depthOffset + xyOffset) * strideRGBA;
                const destIdx = xyOffset * strideRGBA;
                const grey = img.data[srcIdx];
                imgData.data[destIdx] = grey; // R
                imgData.data[destIdx + 1] = grey; // G
                imgData.data[destIdx + 2] = grey; // B
                imgData.data[destIdx + 3] = 255; // A
            }
        }
        ctx.putImageData(imgData, 0, 0);
        layers.push({
            id: chunk.material.texture.layerIDs[layer],
            blend: canvas.toDataURL('image/png'),
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return layers;
}

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
            iconPromises.push(loadImage(def.diffuse));
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

    private addLayerToChunk(chunk: Chunk, layerID: string): void {
        chunk.def.textures = getBlendMapData(chunk); // save blend maps to chunk def
        chunk.def.textures.push(<ChunkTexture>{ // add the new texture layer
            id: layerID,
            blend: generateTexture(defaultBlendSize, defaultBlendSize, 'black'),
        });
        chunk.reloadMaterial(); // reload the chunk material from def
    }

    public use(delta: number): void {
        for (const point of this.brush.pointsIn()) {
            const chunkPoint = point.toChunk();
            if (chunkPoint != null) {
                const layerDepth = this.getLayerDepth(chunkPoint.chunk, this.librarySelectedTerrainID);
                if (layerDepth == null) {
                    this.addLayerToChunk(chunkPoint.chunk, this.librarySelectedTerrainID);
                    break;
                }
                this.directDraw(chunkPoint, layerDepth, this.strength);
            }
        }
    }

    public update(delta: number): void {
        super.update(delta);
        this.brush.update();
    }
}
