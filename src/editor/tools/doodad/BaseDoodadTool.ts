import { Key } from 'ts-key-enum';
import Tool from '../../Tool';
import Input, { MouseButton } from '../../../client/engine/Input';
import EditorProps from '../../EditorProps';

export default class BaseDoodadTool extends Tool {
    public doodadUse(delta: number): void {
    }

    public use(delta: number): void {
        if (this.props.selectedDoodad) {
            // when control is down we are in select mode
            if (!Input.isKeyDown(Key.Control)) {
                this.doodadUse(delta);
                this.props.selectedDoodad.positionInWorld();
            }
        }
    }

    public static deleteSelected(props: EditorProps): void { // this is static so we can access from DoodadSelectTool
        if (props.selectedDoodad != null) {
            const chunk = props.selectedDoodad.chunk;
            // remove the doodad def from the chunk def so it exports
            chunk.def.doodads = chunk.def.doodads.filter((dd) => dd.uuid !== props.selectedDoodad.def.uuid);
            // remove the doodad from the scene
            props.selectedDoodad.unload();
            chunk.doodads.delete(props.selectedDoodad.def.uuid);
            props.selectedDoodad = null;
        }
    }

    public update(delta: number): void {
        // handle select when control is down
        if (Input.wasMousePressed(MouseButton.LEFT) && Input.isKeyDown(Key.Control)) {
            const intersects = this.props.camera.rcast(this.props.scene, Input.mousePos(), true);
            for (const ints of intersects) {
                if (ints.object.userData.doodad) {
                    this.props.selectedDoodad = ints.object.userData.doodad;
                    break;
                }
            }
        }

        if (Input.wasKeyPressed(Key.Delete)) {
            BaseDoodadTool.deleteSelected(this.props);
        }
    }
}
