const INITIAL_STATE = {
  auditList: [],
  loading: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'REQUEST_AUDIT_TRIALS':
      return {
        ...state,
        loading: true,
      };
    case 'SET_AUDIT_TRIALS':
      return {
        ...state,
        loading: false,
        auditList: action.payload,
      };
    default:
      return state;
  }
};
