import { Key } from 'ts-key-enum';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import BaseDoodadTool from './BaseDoodadTool';
import { Point } from '../../../common/Point';
import Input, { MouseButton } from '../../../client/engine/Input';
import Chunk from '../../../client/models/Chunk';

export default class DoodadMoveTool extends BaseDoodadTool {
    private mouseStart: Point;
    private initialElevation: number;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-move',
            '- Left click to move the selected doodad.\n'
            + '- Control + left click to select a doodad.',
            'assets/icons/doodad_move.png',
            props, panel,
        );
    }

    public static transferDoodad(uuid: string, oldChunk: Chunk, newChunk: Chunk): void {
        for (let i = 0; i < oldChunk.def.doodads.length; i++) {
            const def = oldChunk.def.doodads[i];
            if (def.uuid === uuid) { // find the def index
                const dd = oldChunk.doodads.get(uuid);
                // save the doodad to the new chunk
                newChunk.doodads.set(uuid, dd);
                newChunk.def.doodads.push(dd.def);
                dd.chunk = newChunk;
                // remove the def from its old chunk
                oldChunk.def.doodads.splice(i, 1);
                if (dd) {
                    oldChunk.doodads.delete(uuid);
                }
                break;
            }
        }
    }

    public doodadUse(delta: number): void {
        if (Input.isKeyDown(Key.Shift)) {
            const mouseDelta = Input.mousePos().sub(this.mouseStart);
            this.props.selectedDoodad.def.elevation = this.initialElevation - mouseDelta.y / 100;
        } else {
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
    }

    public update(delta: number): void {
        super.update(delta);

        // handle height initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.props.selectedDoodad) {
                this.initialElevation = this.props.selectedDoodad.def.elevation;
            }
        }
    }
}
