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

// netlify/functions/compare.ts
var compare_exports = {};
__export(compare_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(compare_exports);
var import_supabase_js = require("@supabase/supabase-js");
var cors = (body, status = 200) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
  body: JSON.stringify(body)
});
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  if (event.httpMethod !== "POST") return cors({ error: "Method not allowed" }, 405);
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return cors({ error: "Unauthorized" }, 401);
  const supabase = (0, import_supabase_js.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return cors({ error: "Unauthorized" }, 401);
  const { analysis_ids } = JSON.parse(event.body || "{}");
  if (!Array.isArray(analysis_ids) || analysis_ids.length < 2 || analysis_ids.length > 3) return cors({ error: "Provide 2\u20133 analysis IDs" }, 400);
  const admin = (0, import_supabase_js.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: analyses } = await admin.from("analyses").select("*").in("id", analysis_ids).eq("user_id", user.id);
  if (!analyses || analyses.length < 2) return cors({ error: "Analyses not found" }, 404);
  return cors({ analyses });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
