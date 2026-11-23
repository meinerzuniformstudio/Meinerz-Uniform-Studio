import{primeAssets,primeImport}from'../lib/prime-assets.mjs';
import {servePackedVendorScript} from '../lib/static-vendor-scripts.mjs';
import {serveMoldPack} from '../lib/mold-pack-download.mjs';
import {serveCompressedMold} from '../lib/static-mold-binaries.mjs';
import {serveMoldDrawing} from '../lib/static-mold-drawings.mjs';
import {resetMoldCatalog} from '../lib/mold-catalog-reset.mjs';
import {replaceMaxProjectArt} from '../lib/max-project-replacement.mjs';
import {replaceVRaglanProjectArt} from '../lib/v-raglan-project-replacement.mjs';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import {secureResponse} from '../lib/security-headers.mjs';

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const imported=await primeImport(request,env);if(imported)return secureResponse(request,imported);
    const staticAssets=primeAssets(env.ASSETS,env.BUCKET);
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const vendorScript=await servePackedVendorScript(request,staticAssets);
    if(vendorScript)return secureResponse(request,vendorScript);
    const moldPack=serveMoldPack(request,staticAssets);
    if(moldPack)return secureResponse(request,moldPack);
    const drawing=await serveMoldDrawing(request,staticAssets);
    if(drawing)return secureResponse(request,drawing);
    const packedModel=await serveCompressedMold(request,staticAssets);
    if(packedModel)return secureResponse(request,packedModel);
    // Static files and session discovery never wait on historical DB cleanup.
    const path=new URL(request.url).pathname;
    if(!/^\/(?:assets|simulador|vendor|fonts)\//.test(path)&&path!=='/simulador'&&!path.startsWith('/api/simulator/')&&!/\.(?:js|css|svg|png|ico|html)$/.test(path)){
    await resetMoldCatalog(env.DB,env.BUCKET);
    await replaceVRaglanProjectArt(env.DB);
    await replaceMaxProjectArt(env.DB);
    }
    const response=await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    return secureResponse(request,response);
  },
};

export default worker;
