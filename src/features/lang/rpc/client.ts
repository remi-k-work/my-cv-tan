// services, features, and other libraries
import { makeRpcClient } from "@/domain";
import { RpcLang } from "./requests";

export class RpcLangClient extends makeRpcClient("RpcLangClient", RpcLang, "/api/rpc/lang") {}
