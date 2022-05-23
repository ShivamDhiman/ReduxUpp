const INITIAL_STATE = {
  surveyList: [],
  loading: false,
  total: 0,
  error: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'RECEIVE_SURVEY':
      return {
        ...state,
        surveyList: action.payload,
        total: action.payload.length,
        loading: false,
      };
    case 'REQUEST_SURVEY':
      return {
        ...state,
        loading: true,
        error: false,
      };
    case 'FAILURE_SURVEY':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};
