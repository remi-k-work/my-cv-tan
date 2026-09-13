export default class PathFinder {
  static toCaptcha = (captchaName: string, shouldReload?: boolean) =>
    shouldReload ? `/api/auth/captcha/${captchaName}?${Date.now()}` : `/api/auth/captcha/${captchaName}`;
}
