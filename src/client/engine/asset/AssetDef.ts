// base asset
export interface AssetDef {
    id: string;
}

// model
interface ModelAssetAnimsDict {
    [index: string]: string
}
export interface ModelAssetDef extends AssetDef {
    src: string;
    anims: ModelAssetAnimsDict;
}

// image
export interface ImageAssetDef extends AssetDef {
    src: string;
}

// atlas
export interface AtlasSpriteAssetDef extends AssetDef {
    src: {
        x: number;
        y: number;
        w: number;
        h: number;
    }
}
interface AtlasAssetSpritesDict {
    [index: string]: AtlasSpriteAssetDef
}
export interface AtlasAssetDef extends AssetDef {
    src: string,
    sprites: AtlasAssetSpritesDict;
}

// sound
export interface SoundAssetDef extends AssetDef {
    src: string;
}

interface ContentModelsDict {
    [index: string]: ModelAssetDef
}
interface ContentImagesDict {
    [index: string]: ImageAssetDef
}
interface ContentAtlasesDict {
    [index: string]: AtlasAssetDef
}
interface ContentSoundsDict {
    [index: string]: SoundAssetDef
}
export default interface ContentDef {
    version: number,
    content: {
        models: ContentModelsDict,
        images: ContentImagesDict,
        atlases: ContentAtlasesDict,
        sounds: ContentSoundsDict,
    }
}
