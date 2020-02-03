import Panel from '../components/Panel';
import AtlasSprite from '../components/AtlasSprite';
import TabContainer from '../TabContainer';
import BaseTab, { setUpTabPanel } from '../BaseTab';
import Label from '../components/Label';
import {
    SkillDef, expToLevel, skillName,
} from '../../../../common/CharacterDef';
import { Point } from '../../../../common/Point';
import Input from '../../Input';
import AssetManager from '../../asset/AssetManager';

const skillIconAtlas = AssetManager.getAtlas('skills');
const iconMargin = 5;
const iconSize = 28;
const skillWidth = 83;
const skillHeight = 32;
const skillsPerRow = 3;

export class SkillIcon extends Panel {
    private def: SkillDef;
    private icon: AtlasSprite;
    private lblLevel: Label;
    private _current: number;
    private _level: number;
    private name: string;
    public get current(): number { return this._current; }
    public set current(val: number) { this._current = val; this.updateLabel(); }
    public get level(): number { return this._level; }
    public set level(val: number) { this._level = val; this.updateLabel(); }
    public experience: number;

    public constructor(parent: SkillsTab, def: SkillDef) {
        super(parent);
        this.def = def;

        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.backgroundColor = 'rgba(255,255,255,0.1)';
        this.style.margin = `${iconMargin / 2}px ${iconMargin}px`;
        this.style.borderRadius = '2px';
        this.width = skillWidth;
        this.height = skillHeight;

        this.addEventListener('mouseenter', (self: SkillIcon, ev: MouseEvent) => {
            Input.openTooltip(new Point(ev.clientX, ev.clientY), [
                this.name,
                `Lvl: ${this.current} / ${this.level}`,
                `Exp: ${this.experience.toFixed(0)}`,
            ]);
        });
        this.addEventListener('mousemove', (self: SkillIcon, ev: MouseEvent) => {
            Input.positionTooltip(new Point(ev.clientX, ev.clientY));
        });
        this.addEventListener('mouseleave', (self: SkillIcon, ev: MouseEvent) => {
            Input.closeTooltip();
        });

        this.name = skillName(this.def.id);
        this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);


        this.icon = skillIconAtlas.getSprite(skillName(this.def.id), this);
        this.icon.style.position = 'initial';
        this.icon.style.display = 'inline-block';
        this.icon.width = iconSize;
        this.icon.height = iconSize;


        this.lblLevel = new Label(this, 'x/x');
        this.lblLevel.style.position = 'initial';
        this.lblLevel.style.display = 'inline-block';
    }

    private updateLabel(): void {
        this.lblLevel.text = `${this.current} / ${this.level}`;
    }
}

export default class SkillsTab extends BaseTab {
    public get name(): string { return 'Skills'; }
    private skillIcons: Map<number, SkillIcon> = new Map();

    public constructor(parent: TabContainer) {
        super(parent);
        setUpTabPanel(this);
        this.width = skillsPerRow * (skillWidth + 2 * iconMargin);
        this.height = parent.height;
    }

    public setSkills(skills: SkillDef[]): void {
        for (const skill of skills) {
            let icon = this.skillIcons.get(skill.id);
            if (icon == null) {
                icon = new SkillIcon(this, skill);
                this.skillIcons.set(skill.id, icon);
            }
            icon.level = expToLevel(skill.experience);
            icon.current = skill.current;
            icon.experience = skill.experience;
        }
    }
}
