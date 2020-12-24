import { Pushgateway } from 'prom-client';

export const initPushgateway = (url: string | undefined) => {
  if (!url) {
    console.log(`No pushgateway URL provided. No metrics will be pushed.`);
    return setInterval(() => {}, 5000);
  }
  const pushgateway = new Pushgateway(url);
  return setInterval(() => pushgateway.pushAdd({ jobName: 'mmo-server' }, () => {}), 5000);
};
