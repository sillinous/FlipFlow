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

// netlify/functions/auth-callback.ts
var auth_callback_exports = {};
__export(auth_callback_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(auth_callback_exports);
var import_supabase_js = require("@supabase/supabase-js");
var handler = async (event) => {
  const params = new URLSearchParams(event.rawQuery || "");
  const code = params.get("code");
  const next = params.get("next") || "/dashboard";
  const origin = event.headers.origin || `https://${event.headers.host}`;
  if (!code) return { statusCode: 302, headers: { Location: `${origin}/login?error=no_code` }, body: "" };
  try {
    const supabase = (0, import_supabase_js.createClient)(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) throw error;
    const { access_token, refresh_token, expires_in } = data.session;
    const cookieOpts = `Path=/; Max-Age=${expires_in}; SameSite=Lax; Secure`;
    return {
      statusCode: 302,
      headers: {
        Location: `${origin}${next}`,
        "Set-Cookie": [
          `sb-access-token=${access_token}; ${cookieOpts}`,
          `sb-refresh-token=${refresh_token}; ${cookieOpts}`
        ].join(", ")
      },
      body: ""
    };
  } catch {
    return { statusCode: 302, headers: { Location: `${origin}/login?error=auth_failed` }, body: "" };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
