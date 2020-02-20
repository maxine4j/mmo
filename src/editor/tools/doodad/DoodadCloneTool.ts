import uuid from 'uuid/v4';
import { Key } from 'ts-key-enum';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import BaseDoodadTool from './BaseDoodadTool';
import Input, { MouseButton } from '../../../client/engine/Input';
import Doodad from '../../../client/models/Doodad';
import { DoodadDef, NavblockDef } from '../../../common/ChunkDef';

export default class DoodadCloneTool extends BaseDoodadTool {
    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-clone',
            '- Left click to place a clone of the selected doodad.\n'
            + '- Control + left click to select a doodad to clone from.',
            'assets/icons/doodad_clone.png',
            props, panel,
        );
    }

    private cloneNavblocks(original: NavblockDef[]): NavblockDef[] {
        const clone: NavblockDef[] = [];
        for (const nb of original) {
            clone.push({
                x: nb.x,
                y: nb.y,
            });
        }
        return clone;
    }

    private cloneDoodad(): void {
        if (this.props.selectedDoodad != null) {
            // clone the selcted doodad and place it at the mouse point
            const chunkPoint = this.props.point.toChunk();
            const chunk = chunkPoint.chunk;

            const def = <DoodadDef>{
                // new
                uuid: uuid(),
                x: chunkPoint.x,
                y: chunkPoint.y,
                // cloned
                elevation: this.props.selectedDoodad.def.elevation,
                rotation: this.props.selectedDoodad.def.rotation,
                scale: this.props.selectedDoodad.def.scale,
                walkable: this.props.selectedDoodad.def.walkable,
                model: this.props.selectedDoodad.def.model,
                // deep cloned
                navblocks: this.cloneNavblocks(this.props.selectedDoodad.def.navblocks),
            };
            chunk.def.doodads.push(def); // save the doodad to the chunk def so it exports

            Doodad.load(def, chunk).then((doodad) => {
                // add the doodad the the world and position it
                chunk.doodads.set(doodad.def.uuid, doodad);
                doodad.positionInWorld();
            });
        }
    }

    public update(delta: number): void {
        super.update(delta);

        if (!Input.isKeyDown(Key.Control) && Input.wasMousePressed(MouseButton.LEFT)) {
            this.cloneDoodad();
        }
    }
}
