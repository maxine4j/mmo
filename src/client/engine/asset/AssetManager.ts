import ContentDef from './AssetDef';
import Model from '../graphics/Model';
import CachedModel from './CachedModel';
import _content from '../../assets/content.json';
import SpriteAtlas from './SpriteAtlas';
import { TerrainTexture, TerrainTextureDef } from '../graphics/Texture';

export const contentDef = <ContentDef>_content;

export default class AssetManager {
    private static modelCache: Map<string, CachedModel> = new Map();
    private static atlasCache: Map<string, SpriteAtlas> = new Map();

    public static getModel(id: string): Promise<Model> {
        return new Promise((resolve, reject) => {
            const existing = this.modelCache.get(id);
            if (existing) {
                if (existing.loaded) {
                    // model is in cache and it is loaded
                    resolve(new Model(existing));
                } else {
                    // model is in cache but still being loaded
                    existing.on('loaded', () => resolve(new Model(existing)));
                    existing.on('loadError', (err) => reject(new Error(`Failed to load model data: ${id}`)));
                }
            } else {
                // model is not in cache, so load it and resolve when it is loaded
                const def = contentDef.content.models[id];
                if (def) {
                    // start a new cached model loading and save to the cache
                    const cm = new CachedModel(def);
                    this.modelCache.set(id, cm);
                    // return the model once it has loaded
                    cm.on('loaded', () => resolve(new Model(cm)));
                    cm.on('loadError', (err) => reject(new Error(`Failed to load model data: ${id}`)));
                } else {
                    reject(new Error(`Model not found in content definition: ${id}`));
                }
            }
        });
    }

    public static getAtlas(id: string): SpriteAtlas {
        const existing = this.atlasCache.get(id);
        if (existing) {
            return existing;
        }
        const def = contentDef.content.atlases[id];
        if (def) {
            const atlas = new SpriteAtlas(def);
            this.atlasCache.set(def.id, atlas);
            return atlas;
        }
        throw new Error(`Atlas not found in content definition: ${id}`);
    }

    public static loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    public static async getTerrain(id: string): Promise<TerrainTextureDef> {
        const def = contentDef.content.terrain[id];

        const [diffuse, depth] = await Promise.all([
            this.loadImage(def.diffuse),
            this.loadImage(def.depth),
        ]);

        return <TerrainTextureDef>{
            id,
            diffuse,
            depth,
        };
    }
}
