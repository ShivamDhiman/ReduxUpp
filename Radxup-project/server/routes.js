const nextRoutes = require('next-routes');
const routes = (module.exports = nextRoutes());

const APP_ROUTES = [
  {
    page: 'index',
    pattern: '/',
  },
  {
    page: 'index',
    pattern: '/home',
  },
  {
    page: 'login',
    pattern: '/login',
  },
  {
    page: 'e-consent',
    pattern: '/e-consent',
  },
  {
    page: 'e-consent/[id]',
    pattern: '/e-consent/:id',
  },
  {
    page: 'analytics',
    pattern: '/analytics',
  },
  {
    page: 'forms',
    pattern: '/forms',
  },
  {
    page: 'forms/[id]',
    pattern: '/forms/:id',
  },
  {
    page: 'informed-consent-form',
    pattern: '/informed-consent-form',
  },
  {
    page: 'informed-consent-form/[id]',
    pattern: '/informed-consent-form/:id',
  },
  {
    page: 'participant-management',
    pattern: '/participant-management',
  },
  {
    page: 'participant-management/[id]',
    pattern: '/participant-management/:id',
  },
  {
    page: 'data-management',
    pattern: '/data-management',
  },
  {
    page: 'data-management/[id]',
    pattern: '/data-management/:id',
  },
  {
    page: 'user-management',
    pattern: '/user-management',
  },
  {
    page: 'survey',
    pattern: '/survey',
  },
  {
    page: 'my-tasks',
    pattern: '/my-tasks',
  },
  {
    page: 'study-setting',
    pattern: '/study-setting',
  },
  {
    page: 'study-setting/[id]',
    pattern: '/study-setting/:id',
  },
  {
    page: 'preview/[id]',
    pattern: '/preview/:id',
  },
  // {
  //   page: 'generic',
  //   pattern: '/:id',
  // },
  {
    page: 'radxup/sso',
    pattern: '/radxup/sso',
  },
  {
    page: 'dashboard',
    pattern: '/dashboard',
  },
  {
    page: 'study-management',
    pattern: '/study-management',
  },
  {
    page: 'study-management/[id]',
    pattern: '/study-management/:id',
  },
  {
    page: 'audit-trail',
    pattern: '/audit-trail',
  },
  {
    page: 'cde-library',
    pattern: '/cde-library',
  },
  {
    page: 'unauthorize',
    pattern: '/unauthorize',
  },
];

APP_ROUTES.forEach((route) => routes.add(route));
