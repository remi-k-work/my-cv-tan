// services, features, and other libraries
import { makeRpcClient } from "@/domain/helpers";
import { RpcContactMe } from "./requests";

export class RpcContactMeClient extends makeRpcClient("RpcContactMeClient", RpcContactMe, "/api/rpc/contact-me") {}
