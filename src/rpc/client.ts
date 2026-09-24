// services, features, and other libraries
import { makeRpcClient } from "@/domain";
import { RpcApp } from "./requests";

export class RpcAppClient extends makeRpcClient("RpcAppClient", RpcApp, "/api/rpc") {}
