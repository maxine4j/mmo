import ContentDef from './AssetDef';
import Model from '../graphics/Model';
import CachedModel from './CachedModel';
import _content from '../../assets/content.json';
import SpriteAtlas from './SpriteAtlas';

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
}
