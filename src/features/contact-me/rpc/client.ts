// services, features, and other libraries
import { makeRpcClient } from "@/domain";
import { RpcContactMe } from "./requests";

export class RpcContactMeClient extends makeRpcClient("RpcContactMeClient", RpcContactMe, "/api/rpc/contact-me") {}
