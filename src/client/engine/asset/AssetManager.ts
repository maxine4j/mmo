import ContentDef from './AssetDef';
import Model from '../graphics/Model';
import CachedModel from './CachedModel';
import _content from '../../assets/content.json';

const contentDef = <ContentDef>_content;

export default class AssetManager {
    private static modelCache: Map<string, CachedModel> = new Map();

    public static loadAnim(modelID: string, animID: string): void {
        const def = contentDef.content.models[modelID];
        const cm = this.modelCache.get(def.id);
        cm.loadAnim(animID);
    }

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
}
