import { Key } from 'ts-key-enum';
import Tool from '../../Tool';
import Input, { MouseButton } from '../../../client/engine/Input';

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
    }
}
