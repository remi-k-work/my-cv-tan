// services, features, and other libraries
import { makeRpcClient } from "@/domain";
import { RpcCaptcha } from "./requests";

export class RpcCaptchaClient extends makeRpcClient("RpcCaptchaClient", RpcCaptcha, "/api/rpc/captcha") {}
