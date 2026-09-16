// services, features, and other libraries
import { makeRpcClient } from "@/lib/rpc";
import { RpcMain } from "./requests";

export class RpcMainClient extends makeRpcClient("RpcMainClient", RpcMain, "/api/rpc") {}
