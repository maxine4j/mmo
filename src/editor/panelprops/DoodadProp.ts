import PanelProp from '../PanelProp';
import PropsPanel from '../PropsPanel';
import Panel from '../../client/engine/interface/components/Panel';
import EditorProps from '../EditorProps';
import TextboxProp from './TextboxProp';
import Doodad from '../../client/engine/Doodad';
import SliderProp from './SliderProp';

export default class DoodadProp extends PanelProp {
    private panel: Panel;
    private editorProps: EditorProps;

    private propUuid: TextboxProp;
    private propRotation: SliderProp;
    private propScale: SliderProp;
    private propElevation: SliderProp;

    public constructor(parent: PropsPanel, editorProps: EditorProps) {
        super(parent);

        this.editorProps = editorProps;

        this.panel = new Panel(parent);
        this.panel.width = 300;
        this.panel.height = 400;
        this.panel.style.top = '0';
        this.panel.style.right = '0';
        this.panel.style.backgroundColor = 'rgba(0,0,0,0.8)';

        this.propUuid = new TextboxProp(this.panel, 'UUID:', '',
            (val: string) => {
                if (this.editorProps.selectedDoodad != null) {
                    this.editorProps.selectedDoodad.def.uuid = val;
                }
            });
        this.propRotation = new SliderProp(this.panel, 'Rotation:', 0, 360, 1, 0,
            (val: number) => {
                if (this.editorProps.selectedDoodad != null) {
                    this.editorProps.selectedDoodad.def.rotation = val * (Math.PI / 180);
                    this.editorProps.selectedDoodad.positionInWorld();
                }
            });
        this.propScale = new SliderProp(this.panel, 'Scale:', 0, 50, 0.01, 0,
            (val: number) => {
                if (this.editorProps.selectedDoodad != null) {
                    this.editorProps.selectedDoodad.def.scale = val;
                    this.editorProps.selectedDoodad.positionInWorld();
                }
            });
        this.propElevation = new SliderProp(this.panel, 'Elevation:', -100, 100, 0.01, 0,
            (val: number) => {
                if (this.editorProps.selectedDoodad != null) {
                    this.editorProps.selectedDoodad.def.elevation = val;
                    this.editorProps.selectedDoodad.positionInWorld();
                }
            });


        this.editorProps.on('selectedDoodadChanged', this.updateValues.bind(this));
    }

    private updateValues(): void {
        if (this.editorProps.selectedDoodad) {
            this.propUuid.text = this.editorProps.selectedDoodad.def.uuid;
            this.propRotation.value = this.editorProps.selectedDoodad.def.rotation / (Math.PI / 180);
            this.propScale.value = this.editorProps.selectedDoodad.def.scale;
            this.propElevation.value = this.editorProps.selectedDoodad.def.elevation;
        }
    }

    public show(): void {
        this.updateValues();
    }

    public hide(): void {
    }
}
