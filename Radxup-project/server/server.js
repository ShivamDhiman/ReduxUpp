const path = require('path');
const express = require('express');
const compression = require('compression');
const next = require('next');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const useragent = require('express-useragent');
const routes = require('./routes');
require('dotenv').config();
require('./data/modelsList');
const sso = require('./services/sso');
const authService = require('./services/authService');
require('./services/passport')(passport, sso);
const port = parseInt(process.env.PORT, 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = routes.getRequestHandler(app);
global.serverPath = __dirname;
app.prepare().then(() => {
  const server = express();
  server.disable('x-powered-by');
  server.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  });
  server.use(compression());
  server.use(bodyParser.json({limit: '50mb'}));
  server.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
  server.use(useragent.express());

  server.set('views', path.join(__dirname, '../public'));
  server.set('view engine', 'ejs');
  server.use(cookieParser());
  server.use(session({ resave: true, saveUninitialized: true, secret: 'this shit hits' }));
  server.use(passport.initialize());
  server.use(passport.session());

  const staticPath = path.join(__dirname, '../static');
  server.use(
    morgan(
      'RequestTime: :date[iso] HTTPVersion: HTTP/:http-version Method: :method RequestHeader: :req[header] URL: :url RemoteAddres: :remote-addr UserAgent: :user-agent Status: :status  TotalTime: :total-time ms ResponseTime: :response-time ms'
    )
  );

  server.use(
    multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, __dirname + '/uploads/');
        },
        filename: (req, file, cb) => {
          let fileExt = path.extname(file.originalname);
          let fileName = path.parse(file.originalname).name.replace(/[\s.]/g, '_') + '_' + Date.now() + fileExt;
          cb(null, fileName);
        },
      }),
    }).any()
  );

  server.use(
    '/static',
    express.static(staticPath, {
      maxAge: '30d',
      immutable: true,
    })
  );

  const landingpages = {
    '/login': {
      title: 'login',
      description: 'Login',
      canonical: '/login',
      page: '/login',
      noindex: true,
    },
    '/signup': {
      title: 'signup',
      description: 'Sign Up',
      canonical: '/signup',
      page: '/signup',
      noindex: true,
    },
  };

  for (const [route, { page }] of Object.entries(landingpages)) {
    server.get(route, (req, res) => {
      return app.render(req, res, page, req.query);
    });
  }

  // 500 error handler (middleware)
  server.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).render({ success: false, messgae: err.stack });
  });

  // setTimeout(()=>{
  //   require('./services/cronJob');
  // },20000);

  // Server health end point
  server.use('/server/health', function (req, res, next) {
    res.send({ success: true, message: 'Server is running...', useragent: req.headers['user-agent'] });
  });

  server.get('/api/sendsurvey',  function (req, res, next) {
    require('./services/cronJob').sendForm(req, res);
  });

  server.get('/api/batchqueue',  function (req, res, next) {
    if(!req.query.queueId){
      return res.send({ success: false, message: 'Queue Id is missing' });
    }
    require('./services/formDependencyEngine').startFormDependencyEngine(parseInt(req.query.queueId));
    res.send({ success: true, message: 'Queue processing started'});
  });

  server.get('/api/batch',  function (req, res, next) {
      require('./services/formDependencyEngine').formDependencyEngine();
      res.send({ success: true, message: 'batch processing started' });
  });

  // InCommon SSO login routes
  server.get('/api/sso/login',   passport.authenticate('saml'));
  server.post('/radxup/sso',     authService.ssoLogin);
  server.use('/api/users',       require('./routes/users'));
  server.use('/api/participant', require('./routes/participant'));
  server.use('/api/forms',       require('./routes/forms'));
  server.use('/api/feedback',    require('./routes/feedbacks'));
  server.use('/api/cde',         require('./routes/CDE'));
  server.use('/api/studycde',    require('./routes/StudyCDE'));
  //server.use('/api/eicf',        require('./routes/eICF'));
  server.use('/api/eicfform',    require('./routes/eICFForm'));
  server.use('/api/survey',      require('./routes/survey'));
  server.use('/api/study',       require('./routes/study'));
  server.use('/api/analytics',   require('./routes/analytics'));

  server.get('*', (req, res) => {
    return handler(req, res, req.url);
  });

  server.listen(port, () => {
    console.log(`node-server:serve ${process.env.NODE_ENV} Ready on ${port}`);
  });
});
