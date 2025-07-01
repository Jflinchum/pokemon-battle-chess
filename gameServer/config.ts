export const config = {
  devConfig: {
    keyLocation: "private-key.pem",
    certLocation: "certificate.pem",
    allowedOrigins: ["https://localhost:3001", "https://localhost:5173"],
    httpPort: 3002,
    httpsPort: 3003,
  },

  prodConfig: {
    keyLocation: "private-key.pem",
    certLocation: "certificate.pem",
    allowedOrigins: ["https://lobby-service"],
    httpPort: process.env.PORT || 3002,
    httpsPort: 3003,
  },
};
