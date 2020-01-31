import Rectangle from '../../../../common/Rectangle';
import Panel from '../components/Panel';
import SpriteAtlas from '../components/SpriteAtlas';
import SpriteAtlasImage from '../components/SpriteAtlasImage';
import TabContainer from '../TabContainer';
import BaseTab, { setUpTabPanel } from '../BaseTab';
import Label from '../components/Label';

const atlasIconSize = 25;
const atlas = new SpriteAtlas('assets/icons/skills.png');

export class SkillIcon extends Panel {
    public icon: SpriteAtlasImage;
    private lblLevel: Label;
    private _current: number;
    public get current(): number { return this._current; }
    public set current(val: number) { this._current = val; this.updateLabel(); }
    private _level: number;
    public get level(): number { return this._level; }
    public set level(val: number) { this._level = val; this.updateLabel(); }

    public constructor(parent: SkillsTab, margin: number, iconSize: number, width: number, height: number) {
        super(parent);
        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.backgroundColor = 'rgba(255,255,255,0.1)';
        this.style.margin = `${margin / 2}px ${margin}px`;
        this.style.borderRadius = '2px';
        this.width = width;
        this.height = height;

        this.icon = new SpriteAtlasImage(this, atlas, new Rectangle(0, 0, atlasIconSize, atlasIconSize));
        this.icon.style.position = 'initial';
        this.icon.style.display = 'inline-block';
        this.icon.width = iconSize;
        this.icon.height = iconSize;

        this.lblLevel = new Label(this, 'x/x');
        this.lblLevel.style.position = 'initial';
        this.lblLevel.style.display = 'inline-block';
        this.current = 130;
        this.level = 99;
    }

    private updateLabel(): void {
        this.lblLevel.text = `${this.current} / ${this.level}`;
    }
}

export default class SkillsTab extends BaseTab {
    public get name(): string { return 'Skills'; }
    private readonly skillCount: number = 23;
    private readonly skillsPerRow: number = 3;
    private readonly margin: number = 5;
    private readonly skillWidth: number = 83;
    private readonly skillHeight: number = 32;
    private readonly skillIconSize: number = 28;
    private skillIcons: Map<number, SkillIcon> = new Map();

    public constructor(parent: TabContainer) {
        super(parent);
        setUpTabPanel(this);
        this.width = this.skillsPerRow * (this.skillWidth + 2 * this.margin);
        this.height = parent.height;

        for (let i = 0; i < this.skillCount; i++) {
            this.skillIcons.set(i, new SkillIcon(this, this.margin, this.skillIconSize, this.skillWidth, this.skillHeight));
        }
    }
}
