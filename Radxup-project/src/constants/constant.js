// import Analytics from 'icons/logo.svg';

export const appMenuItems = [
  {
    id: 1,
    name: 'Analytics',
    link: '/analytics',
    Icon: '/images/analytics.svg',
    IconActive: '/images/analytics-active.svg',
  },
  {
    id: 2,
    name: 'My Tasks',
    link: '/my-tasks',
    Icon: '/images/myTask.svg',
    IconActive: '/images/myTask-active.svg',
  },
  {
    id: 3,
    name: 'e-Informed Consent Form',
    link: '/informed-consent-form',
    Icon: '/images/form.svg',
    IconActive: '/images/e-form-active.svg',
  },
  {
    id: 4,
    name: 'Form Management',
    link: '/forms',
    Icon: '/images/test.svg',
    IconActive: '/images/active-form2.svg',
  },
  {
    id: 5,
    name: 'Participant Management',
    link: '/participant-management',
    Icon: '/images/hands.svg',
    IconActive: '/images/participant-management-active.svg',
  },
  {
    id: 6,
    name: 'Data Management',
    link: '/data-management',
    Icon: '/images/data-storage.svg',
    IconActive: '/images/data-storage-active.svg',
  },
  {
    id: 7,
    name: 'Study Setting',
    link: '/study-setting',
    Icon: '/images/study-setting.svg',
    IconActive: '/images/study-setting-active.svg',
  },
  {
    id: 8,
    name: 'User Management',
    link: '/user-management',
    Icon: '/images/user-management.svg',
    IconActive: '/images/user-management-active.svg',
  },
  {
    id: 9,
    name: 'Dashboard',
    link: '/dashboard',
    Icon: '/images/dashboard.svg',
    IconActive: '/images/dashboard-active.svg',
  },
  {
    id: 10,
    name: 'Study Management',
    link: '/study-management',
    Icon: '/images/study-Mgmt.svg',
    IconActive: '/images/study-Mgmt-active.svg',
  },
  {
    id: 11,
    name: 'Audit Trail',
    link: '/audit-trail',
    Icon: '/images/audit-trail.svg',
    IconActive: '/images/audit-active.svg',
  },
  {
    id: 12,
    name: 'CDE Library',
    link: '/cde-library',
    Icon: '/images/cde-library.svg',
    IconActive: '/images/cde-library-active.svg',
  },
  
];

export const LANGUAGE_LIST = [
  { name: 'English', selected: true },
  { name: 'Spanish', selected: true },
  // {name: 'German', selected: false},
  // {name: 'French', selected: false}
];

export const ADMIN_ROLE = 1;
export const COORDINATOR_ROLE = 2;
export const PARTICIPANT_ROLE = 3;
export const SUPER_ADMIN_ROLE = 4;
export const routesConfig = {
  '/': {
    path: '/',
    redirect: '/',
    protected: false,
    access: [ADMIN_ROLE, COORDINATOR_ROLE, SUPER_ADMIN_ROLE],
  },
  // '/login': {
  //   path: '/login',
  //   redirect: '/login',
  //   protected: false,
  //   access: [ADMIN_ROLE, COORDINATOR_ROLE, SUPER_ADMIN_ROLE],
  // },
  '/analytics': {
    path: '/analytics',
    protected: true,
    redirect: '/my-tasks',
    access: [ADMIN_ROLE],
  },
  '/study-setting': {
    path: '/study-setting',
    protected: true,
    redirect: '/my-tasks',
    access: [ADMIN_ROLE],
  },
  '/data-management': {
    path: '/data-management',
    protected: true,
    redirect: '/my-tasks',
    access: [ADMIN_ROLE, COORDINATOR_ROLE],
  },
  '/data-management/[id]': {
    path: '/data-management/[id]',
    protected: true,
    redirect: '/my-tasks',
    access: [ADMIN_ROLE, COORDINATOR_ROLE],
  },
  '/my-tasks': {
    path: '/my-tasks',
    protected: true,
    redirect: '/analytics',
    access: [COORDINATOR_ROLE, ADMIN_ROLE],
  },
  '/participant-management': {
    path: '/participant-management',
    protected: true,
    redirect: '/my-tasks',
    access: [ADMIN_ROLE, COORDINATOR_ROLE],
  },
  '/participant-management/[id]': {
    path: '/participant-management/[id]',
    protected: true,
    redirect: '/my-tasks',
    access: [COORDINATOR_ROLE, ADMIN_ROLE],
  },
  '/survey': {
    path: '/survey',
    redirect: '/',
    protected: false,
    access: [ADMIN_ROLE, COORDINATOR_ROLE],
  },
  '/user-management': {
    path: '/user-management',
    protected: true,
    redirect: '/my-tasks',
    access: [ADMIN_ROLE],
  },
  '/informed-consent-form': {
    path: '/informed-consent-form',
    redirect: '/my-tasks',
    protected: true,
    access: [ADMIN_ROLE],
  },
  '/informed-consent-form/[id]': {
    path: '/informed-consent-form/[id]',
    redirect: '/my-tasks',
    protected: true,
    access: [ADMIN_ROLE],
  },
  '/e-consent': {
    path: '/e-consent',
    redirect: '/my-tasks',
    protected: false,
    access: [ADMIN_ROLE, COORDINATOR_ROLE],
  },
  '/e-consent/[id]': {
    path: '/e-consent/[id]',
    redirect: '/my-tasks',
    protected: false,
    access: [ADMIN_ROLE, COORDINATOR_ROLE],
  },
  '/forms': {
    path: '/forms',
    redirect: '/my-tasks',
    protected: true,
    access: [ADMIN_ROLE],
  },
  '/forms/[id]': {
    path: '/forms/[id]',
    redirect: '/my-tasks',
    protected: true,
    access: [ADMIN_ROLE],
  },
  '/dashboard': {
    path: '/dashboard',
    redirect: '/',
    protected: true,
    access: [SUPER_ADMIN_ROLE],
  },
  '/study-management': {
    path: '/study-management',
    redirect: '/dashboard',
    protected: true,
    access: [SUPER_ADMIN_ROLE],
  },
  '/study-management/[id]': {
    path: '/study-management/[id]',
    redirect: '/dashboard',
    protected: true,
    access: [SUPER_ADMIN_ROLE],
  },
  '/audit-trail': {
    path: '/audit-trail',
    redirect: '/dashboard',
    protected: true,
    access: [SUPER_ADMIN_ROLE],
  },
  '/cde-library': {
    path: '/cde-library',
    redirect: '/dashboard',
    protected: true,
    access: [SUPER_ADMIN_ROLE],
  },
};

export const userConfig = {
  1: '/analytics',
  2: '/my-tasks',
  3: '/404',
  4: '/dashboard',
};

export const SyncStatusKey = {
  PUSH_REQUIRED: { key: 'PUSH_REQUIRED', lable: 'Push Required' },
  PUSHED: { key: 'PUSHED', lable: 'Pushed' },
};

export const ArmList = [
  { id: 'Arm 1', label: 'Arm 1' },
  { id: 'Arm 2', label: 'Arm 2' },
  { id: 'Arm 3', label: 'Arm 3' },
];

export const defaultDocs = [
  {
    document_type: 'IRB Approval',
    document: [],
  },
  {
    document_type: 'IRB Protocol',
    document: [],
  },
  {
    document_type: 'Data Use Agreement',
    document: [],
  },
  {
    document_type: 'Informed Consent Form',
    document: [],
  },
  {
    document_type: 'Other',
    document: [],
  },
];

export const PREFER_NOT_ANSWER_TEXT = {
  English: 'Prefer not to answer',
  Spanish: 'Prefiero no responder',
};

export default appMenuItems;

export const eICFQuestions = {
  English: [
    {
      // question: 'I agree to let The Duke Clinical Research Institute to collect all identifiable information.',
      question: 'I agree to let the RADx-UP CDCC collect all identifiable information.',
      options: [
        {
          label: 'Yes',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_ident',
    },
    {
      // question: 'I agree to let The Duke Clinical Research Institute to collect my Social Security number.',
      question: 'I agree to let the RADx-UP CDCC collect my Social Security number.',
      options: [
        {
          label: 'Yes',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_ssn',
    },
    {
      // question: 'I agree to let The Duke Clinical Research Institute to collect only my zip code and no other identifiable information.',
      question: 'I agree to let the RADx-UP CDCC collect only my zip code.',
      options: [
        {
          label: 'Yes',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_zip',
    },
    {
      question: 'I agree to be contacted for future research.',
      options: [
        {
          label: 'Yes',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_recontact',
    },
  ],
  Spanish: [
    {
      question:
        'Acepto darle permiso a Duke Clinical Research Institute para que recolecte toda la información identificable.',
      options: [
        {
          label: 'Sí',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_ident',
    },
    {
      question: 'Acepto que Duke Clinical Research Institute obtenga mi número de seguridad social.',
      options: [
        {
          label: 'Sí',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_ssn',
    },
    {
      question:
        'Acepto darle permiso a Duke Clinical Research Institute para que obtenga solamente mi código postal y ninguna otra información identificable.',
      options: [
        {
          label: 'Sí',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_zip',
    },
    {
      question: 'Acepto que se me contacte para futuras investigaciones.',
      options: [
        {
          label: 'Sí',
          value: true,
        },
        {
          label: 'No',
          value: false,
        },
      ],
      variable_name: 'consent_recontact',
    },
  ],
};
export const ALBHABETS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];
