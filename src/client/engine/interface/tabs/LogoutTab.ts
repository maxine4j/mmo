import { PacketHeader } from '../../../../common/Packet';
import TabContainer from '../TabContainer';
import BaseTab, { setUpTabPanel } from '../BaseTab';
import Button from '../components/Button';
import NetClient from '../../NetClient';
import SceneManager from '../../scene/SceneManager';

export default class LogoutTab extends BaseTab {
    public get name(): string { return 'Logout'; }

    public constructor(parent: TabContainer) {
        super(parent);
        setUpTabPanel(this);
        this.width = 200;
        this.height = parent.height;

        const logoutBtn = new Button(this, 'Logout');
        logoutBtn.style.position = 'initial';
        logoutBtn.style.display = 'block';
        logoutBtn.style.margin = 'auto';
        logoutBtn.addEventListener('click', () => {
            NetClient.send(PacketHeader.PLAYER_LEAVEWORLD);
            SceneManager.changeScene('char-select');
        });
    }
}
