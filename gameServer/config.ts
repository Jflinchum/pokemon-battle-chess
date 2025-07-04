export const config = {
  devConfig: {
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: ["https://localhost:3001", "https://localhost:5173"],
    httpPort: 3002,
    httpsPort: 3003,
  },

  prodConfig: {
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: ["https://lobby-service"],
    httpPort: process.env.PORT || 3002,
    httpsPort: 3003,
  },
};
