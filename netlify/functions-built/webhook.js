"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/webhook.ts
var webhook_exports = {};
__export(webhook_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(webhook_exports);
var import_supabase_js = require("@supabase/supabase-js");
var import_stripe = __toESM(require("stripe"));
var TIER_MAP = {
  [process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || ""]: "starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || ""]: "pro",
  [process.env.NEXT_PUBLIC_STRIPE_SCOUT_PRICE_ID || ""]: "scout"
};
var handler = async (event) => {
  const stripe = new import_stripe.default(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const sig = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return { statusCode: 400, body: "Webhook signature verification failed" };
  }
  const admin = (0, import_supabase_js.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const userId = session.metadata?.user_id;
    const subscriptionId = session.subscription;
    if (userId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id || "";
      const tier = TIER_MAP[priceId] || "starter";
      await admin.from("profiles").update({ subscription_tier: tier, stripe_subscription_id: subscriptionId, stripe_customer_id: session.customer }).eq("id", userId);
    }
  }
  if (stripeEvent.type === "customer.subscription.deleted") {
    const sub = stripeEvent.data.object;
    await admin.from("profiles").update({ subscription_tier: "free" }).eq("stripe_subscription_id", sub.id);
  }
  return { statusCode: 200, body: "ok" };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
