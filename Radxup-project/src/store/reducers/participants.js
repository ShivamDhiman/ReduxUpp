const INITIAL_STATE = {
  participantList: [],
  formListData: [],
  loading: false,
  MangersList: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'REQUEST_PARTICIPANTS':
      return {
        ...state,
        loading: true,
      };
    case 'SET_PARTICIPANTS':
      return {
        ...state,
        loading: false,
        participantList: action.payload,
      };
    case 'REQUEST_FORM_LIST':
      return {
        ...state,
        loading: true,
      };
    case 'SET_FORMLIST':
      return {
        ...state,
        loading: false,
        formListData: action.payload,
      };
    case 'REQUEST_MANGERS':
      return {
        ...state,
        loading: true,
      };
    case 'SET_MANGERS':
      return {
        ...state,
        loading: false,
        MangersList: managersMapper(action.payload),
      };
    default:
      return state;
  }
};

const managersMapper = (list) => {
  if (list.length) {
    list = list.filter((ele) => ele?.first_name && ele?.last_name);
  }
  return list;
};
