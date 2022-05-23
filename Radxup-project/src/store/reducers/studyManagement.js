const INITIAL_STATE = {
  studyManagementList: [],
  loading: false,
  studyDetails: {},
  studyStats: {},
  emailTemplate: [],
  studyContentData: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'REQUEST_STUDY_MGMT':
      return {
        ...state,
        loading: true,
      };
    case 'REQ_STUDY_MGMT_DETAILS':
      return {
        ...state,
        loading: true,
      };
    case 'SET_STUDY_MGMT':
      return {
        ...state,
        loading: false,
        studyManagementList: action.payload,
      };
    case 'SET_STUDY_MGMT_DETAILS':
      return {
        ...state,
        loading: false,
        studyDetails: action.payload,
      };

    case 'REQUEST_STUDIES_STATS':
      return {
        ...state,
        loading: action.loading,
      };
    case 'GET_STUDIES_STATS':
      return {
        ...state,
        loading: false,
        studyStats: action.payload,
      };
    case 'REQUEST_EMAIL_TEMPLATE':
      return {
        ...state,
        loading: true,
      };
    case 'SET_EMAIL_TEMPLATE':
      return {
        ...state,
        loading: false,
        emailTemplate: action.payload,
      };
    case 'REQUEST_STUDY_CONTENT':
      return {
        ...state,
        loading: true,
      };
    case 'SET_STUDY_CONTENT':
      return {
        ...state,
        loading: false,
        studyContentData: action.payload,
      };

    default:
      return state;
  }
};
