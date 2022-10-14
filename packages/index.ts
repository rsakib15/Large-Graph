import { App, ChannelOptions, CiEnv, Service } from '@idg/idg';
import packages from './packages';
import services from './services';
import config from './config.json';

export { default as packages } from './packages';
const { appid, proxyURL, appType, indexRouteName, serviceAppid } = config;
export class IdgApp extends App {
  constructor(ciEnv?: CiEnv) {
    const children: Service[] = services();
    super({
      appid,
      serviceAppid,
      children,
      packages: [
        ...packages,
      ],
      ciEnv,
    });
  }

  public getProxyURL() {
    return this.getServerHost() + proxyURL
  }

  public redirectIndex(cb: () => void) {
    this.router.push({
      name: indexRouteName
    }, cb);
  }
}

export class IdgService extends Service {
  constructor(channelOptions: ChannelOptions) {
    super({
      appid,
      serviceAppid,
      packages,
      channelOptions,
      children: services(),
    });
  }

  redirectIndex(onComplete: () => void) {
    this.root.router.push({
      name: indexRouteName
    }, onComplete);
  }
}

let exports

if (appType === 'app') {
  exports = IdgApp
}

if (appType === 'service') {
  exports = IdgService
}

if (appType === 'packages') {
  exports = packages
}


export default exports;
