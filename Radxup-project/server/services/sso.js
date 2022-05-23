module.exports = {
  passport: {
    strategy: 'saml',
    saml: {
      path: process.env.SSO_CALLBACK,
      entryPoint: process.env.SSO_ENTRYPOINT,
      issuer: process.env.SSO_ISSUER,
      cert: process.env.SSO_CERTIFICATE
    }
  }
};
