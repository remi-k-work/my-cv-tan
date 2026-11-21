// services, features, and other libraries
import { makeRpcClient } from "@/domain/helpers";
import { RpcCaptcha } from "./requests";

export class RpcCaptchaClient extends makeRpcClient("my-cv-v4-tan/features/captcha/rpc/RpcCaptchaClient", RpcCaptcha, "/api/rpc/captcha") {}
