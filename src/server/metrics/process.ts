import { Pushgateway } from 'prom-client';

const initPushgateway = (url: string | undefined): NodeJS.Timeout => {
    if (!url) {
        console.log('No pushgateway URL provided. No metrics will be pushed.');
        return setInterval(() => {}, 5000);
    }
    const pushgateway = new Pushgateway(url);
    return setInterval(() => pushgateway.pushAdd({ jobName: 'mmo-server' }, () => {}), 5000);
};

export default initPushgateway;
