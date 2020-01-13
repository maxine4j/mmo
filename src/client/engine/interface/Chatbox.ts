import { Key } from 'ts-key-enum';
import { Frame } from './Frame';
import TextBox from './TextBox';
import Panel from './Panel';
import { ChatMsgPacket } from '../../../common/Packet';


export default class Chatbox extends Panel {
    private editbox: TextBox;
    public onMessageSend: (msg: string) => void;
    private autoScroll: boolean = true;
    private autoScrollResetDelay: number = 30_000;
    private autoScrollTimeout: number;

    public constructor(id: string, parent: Frame, width: number, height: number) {
        super(id, parent);
        this.style.width = `${width}px`;
        this.style.height = `${height}px`;
        this.style.overflowY = 'scroll';
        this.style.overflowX = 'hidden';
        this.style.wordBreak = 'break-word';
        this.element.classList.add('hide-scrollbar');
        this.editbox = new TextBox(`${id}-editbox`, this);
        this.editbox.style.bottom = '0';
        this.editbox.style.width = `${width - 5}px`;
        this.editbox.addEventListener('keyup', (self: TextBox, ev: KeyboardEvent) => this.onKeyUp(self, ev));
        this.style.paddingBottom = `${this.editbox.height}px`;

        this.element.addEventListener('wheel', (ev: WheelEvent) => {
            this.autoScroll = false;
            // reenable auto scroll with timeout
            window.clearTimeout(this.autoScrollTimeout);
            this.autoScrollTimeout = window.setTimeout(() => { this.autoScroll = true; }, this.autoScrollResetDelay);
            // reenable auto scroll if the user scrolls to the bottom
            if (this.element.scrollTop === (this.element.scrollHeight - this.element.offsetHeight)) {
                this.autoScroll = true;
            }
        });

        // pad the chat log with blank messages so it looks like we start from the bottom
        for (let i = 0; i < 10; i++) {
            this.addRawMessage('\xa0');
        }
    }

    private onKeyUp(self: TextBox, ev: KeyboardEvent) {
        if (ev.key === Key.Enter) {
            if (this.onMessageSend) {
                this.onMessageSend(this.editbox.text);
                this.editbox.text = '';
            }
        }
    }

    public addRawMessage(msg: string) {
        const p = document.createElement('p');
        p.style.margin = '1px';
        p.textContent = msg;
        this.element.appendChild(p);
        if (this.autoScroll) {
            p.scrollIntoView();
        }
    }

    public addChatMessage(msg: ChatMsgPacket) {
        this.addRawMessage(`${msg.authorName}: ${msg.message}`);
    }
}
