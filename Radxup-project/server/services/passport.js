const SamlStrategy = require('passport-saml').Strategy;

module.exports = function (passport, sso) {
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  passport.use(new SamlStrategy(
    sso.passport.saml,
    function (profile, done) {
      return done(null, profile);
    })
  );
};
