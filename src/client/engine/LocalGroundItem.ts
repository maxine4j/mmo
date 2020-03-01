import { GroundItemDef } from '../../common/definitions/ItemDef';
import World from './World';
import Model from './graphics/Model';
import { TilePoint } from '../../common/Point';
import AssetManager from './asset/AssetManager';

export default class LocalGroundItem {
    public def: GroundItemDef;
    private world: World;
    public model: Model;
    private _position: TilePoint;
    public get position(): TilePoint { return this._position; }
    public lastTickUpdated: number;

    public constructor(world: World, def: GroundItemDef) {
        this.world = world;
        this.def = def;
        this._position = new TilePoint(def.position.x, def.position.y, world.chunkWorld);
        AssetManager.getModel('sack')
            .then((model) => {
                this.model = model;
                this.model.obj.traverse((o) => {
                    o.name = 'groundItem';
                    o.userData = {
                        groundItem: this,
                    };
                });
                this.model.obj.position.copy(this.position.toWorld());
                this.world.scene.add(this.model.obj);
            });
    }

    public dispose(): void {
        if (this.model) {
            this.world.scene.remove(this.model.obj);
        }
    }
}
