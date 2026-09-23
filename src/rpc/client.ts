// services, features, and other libraries
import { makeRpcClient } from "@/lib/rpc-client";
import { RpcApp } from "./requests";

export class RpcAppClient extends makeRpcClient("RpcAppClient", RpcApp, "/api/rpc") {}
