import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  modules: [
    {
      resolve: "./src/modules/house_plan",
    },
    {
      resolve: "./src/modules/vendor",
    },
    {
      resolve: "./src/modules/gallery",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/przelewy24",
            id: "default",
            options: {
              merchantId: Number(process.env.P24_MERCHANT_ID),
              posId: Number(process.env.P24_POS_ID),
              crc: process.env.P24_CRC,
              apiKey: process.env.P24_API_KEY,
              sandbox: process.env.P24_SANDBOX !== "false",
              returnUrl: process.env.P24_RETURN_URL,
              notifyUrl: process.env.P24_NOTIFY_URL,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      ssl: false,
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
      bodyParser: {
        sizeLimit: "50mb",
      },
    },
    cookieOptions: {
      sameSite: "lax",
      secure: false,
    },
  },
  admin: {
    vite: (config) => {
      return {
        server: {
          host: "0.0.0.0",
          allowedHosts: [
            "localhost",
            ".localhost",
            "127.0.0.1",
            "admin.marketplace.dom.pl",
          ],
          hmr: {
            port: 5173,
            clientPort: 5173,
          },
        },
      };
    },
  },
});
