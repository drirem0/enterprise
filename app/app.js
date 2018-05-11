/* eslint-disable */
const csp = require('express-csp');
const express = require('express');
const extend = require('extend'); // equivalent of $.extend()
const fs = require('fs');
const mmm = require('mmm');
const path = require('path');

const getJSONFile = require('./src/js/get-json-file');
const logger = require('../scripts/logger');

const app = express();
const BASE_PATH = process.env.BASEPATH || '/';
const packageJSON = getJSONFile('../../../publish/package.json');

app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));
app.set('basepath', BASE_PATH);

mmm.setEngine('hogan.js');
app.engine('html', mmm.__express);

// Because you're the type of developer who cares about this sort of thing!
app.enable('strict routing');

// Serve static assets
app.use(express.static(path.resolve(__dirname, 'www'))); // non-generated
app.use('/ids-css', express.static(path.resolve(__dirname, '..', 'node_modules', 'ids-css', 'dist'))); // ids-css import
app.use('/docs', express.static(path.resolve(__dirname, 'docs'), {
  etag: false
})); // generated by building documentation

app.use(express.static(path.resolve(__dirname, 'dist'), {
  etag: false
})); // app's `/dist` folder (generated by build)
app.use(express.static(path.resolve(__dirname, '..', 'dist'), { // project-level `/dist` folder (generated by build)
  etag: false
}));

// Create the express router with the same settings as the app.
const router = express.Router({
  strict: true
});

// ===========================================
// Default Options / Custom Middleware
// ===========================================
const DEFAULT_RESPONSE_OPTS = {
  enableLiveReload: true,
  layout: 'layout',
  locale: 'en-US',
  title: 'SoHo XI',
  basepath: BASE_PATH,
  version: packageJSON.version,
  csp: true,
  nonce: null
};

// Add CSP headers
csp.extend(app);

// Import various custom middleware (order matters!)
app.use(require('./src/js/middleware/request-logger')(app));
app.use(require('./src/js/middleware/option-handler')(app, DEFAULT_RESPONSE_OPTS));
app.use(require('./src/js/middleware/basepath-handler')(app));
app.use(require('./src/js/middleware/global-data-handler')(app));
app.use(require('./src/js/middleware/response-throttler')(app));
app.use(require('./src/js/middleware/csp-handler')(app));
app.use(router);
app.use(require('./src/js/middleware/error-handler')(app));

const generalRoute = require('./src/js/routes/general');
const sendGeneratedDocPage = require('./src/js/routes/docs');

// ======================================
//  Main Routing and Param Handling
// ======================================
router.get('/', (req, res, next) => {
  res.redirect(`${BASE_PATH}kitchen-sink`);
  next();
});

router.get('/index', (req, res, next) => {
  let opts = {
    path: path.resolve(__dirname, 'docs', 'index.html')
  };
  sendGeneratedDocPage(opts, req, res, next);
});

router.get('/kitchen-sink', (req, res, next) => {
  res.render('kitchen-sink', res.opts);
  next();
});

// =========================================
// Fake 'API' Calls for use with AJAX-ready Controls
// provides routes for `/api/[whatever]`
// =========================================
require('./src/js/routes/data')(router);

// =========================================
// Collection of Performance Tests Pages
// =========================================
router.get('/performance-tests', (req, res, next) => {
  let performanceOpts = { subtitle: 'Performance Tests' },
    opts = extend({}, res.opts, performanceOpts);

  res.render('performance-tests/index.html', opts);
  next();
});

// ======================================
//  Components Routes
// ======================================
const componentOpts = {
  layout: 'layout',
  subtitle: 'Style',
};

router.get('/:type', function(req, res, next) {
  const type = req.params.type;
  if (type !== 'components') {
    res.redirect(`${res.opts.basepath}${req.params.type}/list`);
    return;
  }

  let opts = {
    path: path.resolve(__dirname, 'docs', req.params.type, 'index.html')
  };
  sendGeneratedDocPage(opts, req, res, next);
});

router.get('/:type/', function(req, res, next) {
  res.redirect(`${res.opts.basepath}${req.params.type}`);
});

router.get('/:type/list', function(req, res, next) {
  generalRoute(req, res, next);
});

router.get('/:type/:item', function(req, res, next) {
  let type = req.params.type;
  let item = req.params.item;

  if (type !== 'components') {
    generalRoute(req, res, next);
    return;
  }

  if (item === 'list') {
    next();
    return;
  }

  let opts = {
    path: path.resolve(__dirname, 'docs', req.params.type, `${item}.html`)
  };
  sendGeneratedDocPage(opts, req, res, next);
});

router.get('/:type/:item/', function(req, res, next) {
  res.redirect(`${res.opts.basepath}${req.params.type}/${req.params.item}`);
});

router.get('/:type/:item/list', function(req, res, next) {
  generalRoute(req, res, next);
});

router.get('/:type/:item/:example', function(req, res, next) {
  generalRoute(req, res, next);
});

module.exports = app;
