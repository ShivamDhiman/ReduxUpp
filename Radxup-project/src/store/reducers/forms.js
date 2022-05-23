const INITIAL_STATE = {
  formList: [],
  publishedForms: [],
  loading: false,
  total: 0,
  error: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'RECEIVE_FORMS':
      return {
        ...state,
        formList: dataMapper(action.payload || []),
        publishedForms: dataMapper(action.payload || [], true),
        total: action.payload.length,
        loading: false,
      };
    case 'REQUEST_FORMS':
      return {
        ...state,
        loading: true,
        error: false,
      };
    case 'FAILURE_FORMS':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

const dataMapper = (data, isPublished) => {
  if (isPublished) {
    data = data.filter((form) => form.status === 'Published');
  }
  if (data && data.length) {
    return data.reduce((prevResult, currentItem, index) => {
      const matched = prevResult.find((el) => el.version === currentItem.version && el.name === currentItem.name);
      if (matched) {
        prevResult.map((elm) => {
          if (elm.id === matched.id) {
            elm.languageList = `${matched.language} & ${currentItem.language}`;
          }
          return elm;
        });
      } else {
        currentItem.languageList = `${currentItem.language}`;
      }
      const newItems = matched ? [] : [currentItem];
      return [...prevResult, ...newItems];
    }, []);
  }

  return data;
};
