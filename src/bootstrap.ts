import './uses';
import { App, Service, ERROR_RESPONSE_FORMAT, NetworkError, Language } from '@idg/idg';
import { AxiosResponse } from 'axios';
import packages from '../packages/packages';
import './init.less';
import example from '../packages/example';
import services from '../packages/services';
import config from '../packages/config.json';

const { appid, proxyURL, appType, indexRouteName, lang, serviceAppid } = config;

class MyApp extends App {
  constructor() {
    const children: Service[] = services();
    const language: Language = lang as Language | undefined || 'zh-CN'
    super({
      lang: language,
      appid,
      serviceAppid,
      children,
      packages: [
        ...packages,
        example,
      ],
      type: appType as 'service' | 'app' | undefined
    });
  }

  public getProxyURL() {
    return this.getServerHost() + proxyURL
  }

  public responseHandler(response: AxiosResponse): any {
    if (!response.data) {
      return Promise.reject(new NetworkError(ERROR_RESPONSE_FORMAT, 'no data'));
    }

    const res = response.data;
    if (!res.hasOwnProperty('state') && !res.hasOwnProperty('ret')) {
      return Promise.reject(new NetworkError(
        ERROR_RESPONSE_FORMAT,
        'error response format, should like {state: xx, data: xx}',
      ));
    }
    return res.data;
  };

  public redirectIndex(cb: () => void) {
    this.router.push({
      name: indexRouteName,
    }, cb);
  }
}

const app = new MyApp();
app.startup();
// 账户登录成功事件
app.dispatcher.listen('@idg/account/on-login-success', () => {
  app.redirectIndex(() => { })
});
window.IDG_APP = app;