import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });

      if (session) {
        await prisma.stores.upsert({
          where: { id: session.id },
          update: {
            shop: session.shop,
            state: session.state,
            isOnline: session.isOnline,
            scope: session.scope,
            expires: session.expires,
            accessToken: session.accessToken,
            userId: session.userId ? BigInt(session.userId) : null,
            firstName: session.firstName,
            lastName: session.lastName,
            email: session.email,
            accountOwner: session.accountOwner || false,
            locale: session.locale,
            collaborator: session.collaborator || false,
            emailVerified: session.emailVerified || false,
          },
          create: {
            id: session.id,
            shop: session.shop,
            state: session.state,
            isOnline: session.isOnline,
            scope: session.scope,
            expires: session.expires,
            accessToken: session.accessToken,
            userId: session.userId ? BigInt(session.userId) : null,
            firstName: session.firstName,
            lastName: session.lastName,
            email: session.email,
            accountOwner: session.accountOwner || false,
            locale: session.locale,
            collaborator: session.collaborator || false,
            emailVerified: session.emailVerified || false,
          },
        });
      }
    },
  },
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
