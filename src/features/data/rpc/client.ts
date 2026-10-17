// services, features, and other libraries
import { makeRpcClient } from "@/domain/helpers";
import { RpcData } from "./requests";

export class RpcDataClient extends makeRpcClient("RpcDataClient", RpcData, "/api/rpc/data") {}
