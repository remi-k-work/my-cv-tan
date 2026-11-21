// services, features, and other libraries
import { makeRpcClient } from "@/domain/helpers";
import { RpcData } from "./requests";

export class RpcDataClient extends makeRpcClient("my-cv-v4-tan/features/data/rpc/RpcDataClient", RpcData, "/api/rpc/data") {}
