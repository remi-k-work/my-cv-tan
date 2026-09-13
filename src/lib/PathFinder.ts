// types
enum ParamName {
  captchaName = "[name]",
}

enum PathTo {
  captcha = "/auth/captcha" + `/${ParamName.captchaName}`,
}

export default class PathFinder {
  static toCaptcha = (captchaName: string, shouldReload?: boolean) =>
    shouldReload ? PathTo.captcha.replace(ParamName.captchaName, captchaName) + `?${Date.now()}` : PathTo.captcha.replace(ParamName.captchaName, captchaName);
}
