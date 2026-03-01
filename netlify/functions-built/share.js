"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/share.ts
var share_exports = {};
__export(share_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(share_exports);
var import_supabase_js = require("@supabase/supabase-js");
var url = process.env.NEXT_PUBLIC_SUPABASE_URL;
var anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var cors = (body, status = 200) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
  body: JSON.stringify(body)
});
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" }, body: "" };
  if (event.httpMethod === "GET") {
    const token = new URLSearchParams(event.rawQuery || "").get("token");
    if (!token) return cors({ error: "Token required" }, 400);
    const admin = (0, import_supabase_js.createClient)(url, serviceKey);
    const { data: share } = await admin.from("shared_reports").select("*, analyses(*)").eq("token", token).gt("expires_at", (/* @__PURE__ */ new Date()).toISOString()).single();
    if (!share) return cors({ error: "Report not found or expired" }, 404);
    const analysis = share.analyses;
    await admin.from("shared_reports").update({ view_count: (share.view_count || 0) + 1 }).eq("id", share.id);
    return cors({ analysis: analysis.raw_listing_data, created_at: share.created_at, expires_at: share.expires_at });
  }
  if (event.httpMethod === "POST") {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return cors({ error: "Unauthorized" }, 401);
    const userSupabase = (0, import_supabase_js.createClient)(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) return cors({ error: "Unauthorized" }, 401);
    const { analysis_id } = JSON.parse(event.body || "{}");
    if (!analysis_id) return cors({ error: "analysis_id required" }, 400);
    const admin = (0, import_supabase_js.createClient)(url, serviceKey);
    const { data: analysis } = await admin.from("analyses").select("id").eq("id", analysis_id).eq("user_id", user.id).single();
    if (!analysis) return cors({ error: "Not found" }, 404);
    const shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    await admin.from("shared_reports").insert({ analysis_id, user_id: user.id, token: shareToken, expires_at: expiresAt });
    return cors({ token: shareToken, url: `/report?t=${shareToken}` });
  }
  return cors({ error: "Method not allowed" }, 405);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
