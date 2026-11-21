// services, features, and other libraries
import { makeRpcClient } from "@/domain/helpers";
import { RpcContactMe } from "./requests";

export class RpcContactMeClient extends makeRpcClient("my-cv-v4-tan/features/contact-me/rpc/RpcContactMeClient", RpcContactMe, "/api/rpc/contact-me") {}
