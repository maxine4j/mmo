import Panel from './components/Panel';
import SpriteAtlasImage from './components/SpriteAtlasImage';
import { Frame } from './components/Frame';
import SpriteAtlas from './components/SpriteAtlas';
import Rectangle from '../../../common/Rectangle';
import Button from './components/Button';
import BaseTab from './BaseTab';

const atlas = new SpriteAtlas('assets/icons/tabs.png');
const menuButtonSize = 32;

class Tab {
    public container: TabContainer;
    public panel: Frame;
    public btn: Button;
    public icon: SpriteAtlasImage;

    public constructor(container: TabContainer, menuBar: Panel, panel: Frame, iconSrc: Rectangle) {
        this.container = container;
        this.panel = panel;

        this.btn = new Button(menuBar, '');
        this.btn.style.position = 'initial';
        this.btn.style.padding = '0';
        this.btn.style.margin = '0';
        this.btn.style.backgroundColor = 'rgba(255,255,255,0.4)';
        // this.btn.style.backgroundColor = '#6f6252';
        // this.btn.style.borderColor = '#6f6252';
        this.btn.width = menuButtonSize;
        this.btn.height = menuButtonSize;

        this.icon = new SpriteAtlasImage(this.btn, atlas, iconSrc);
        this.icon.style.position = 'initial';

        this.btn.addEventListener('click', () => {
            this.container.openTab(this);
        });
    }
}

export default class TabContainer extends Panel {
    private tabs: Map<string, Tab> = new Map();
    private menuBar: Panel;
    private currentTab: Tab;

    public constructor(parent: Frame, width: number, height: number) {
        super(parent);

        this.style.backgroundColor = 'rgba(0,0,0,0.2)';
        this.width = width;
        this.height = height;
        this.style.bottom = `${menuButtonSize}px`;
        this.style.right = '0';
        this.clickThrough = true;
        this.hide();

        this.menuBar = new Panel(parent);
        this.menuBar.style.backgroundColor = 'rgbs(0,0,0,0.2)';
        this.menuBar.height = menuButtonSize;
        this.menuBar.width = 0;
        this.menuBar.style.bottom = '0';
        this.menuBar.style.right = '0';
    }

    public addTab(panel: BaseTab, iconSrc: Rectangle): void {
        const tab = new Tab(this, this.menuBar, panel, iconSrc);
        this.tabs.set(panel.id, tab);
        panel.hide();
        this.menuBar.width += menuButtonSize;
    }

    public openTab(tab: Tab): void {
        if (tab !== this.currentTab) {
            if (this.currentTab) this.currentTab.panel.hide();
            this.currentTab = tab;
            this.currentTab.panel.show();
        } else {
            this.currentTab.panel.visible = !this.currentTab.panel.visible;
        }
    }
}
