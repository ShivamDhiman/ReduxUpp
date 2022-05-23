const INITIAL_STATE = {
  UsersList: [],
  loading: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'REQUEST_USERS':
      return {
        ...state,
        loading: true,
      };
    case 'SET_USERS':
      return {
        ...state,
        loading: false,
        UsersList: action.payload,
      };
    default:
      return state;
  }
};
