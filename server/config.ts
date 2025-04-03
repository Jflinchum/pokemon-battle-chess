export const config = {
  devConfig: {
    keyLocation: 'private-key.pem',
    certLocation: 'certificate.pem',
    allowedOrigins: ['https://localhost:5173'],
    httpPort: 3000,
    httpsPort: 3001,
  },

  prodConfig: {
    keyLocation: 'private-key.pem',
    certLocation: 'certificate.pem',
    allowedOrigins: [],
    httpPort: 3000,
    httpsPort: 3001,
  }
};