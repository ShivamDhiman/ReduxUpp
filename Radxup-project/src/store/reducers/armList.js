const INITIAL_STATE = {
  armList: [],
  loading: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'REQUEST_ARM_LIST':
      return {
        ...state,
        loading: true,
      };
    case 'SET_ARM_LIST':
      return {
        ...state,
        loading: false,
        armList: action.payload,
      };
    default:
      return state;
  }
};
