const INITIAL_STATE = {
  ecifList: [],
  ecifPublished: [],
  loading: false,
  total: 0,
  error: false,
  ecifCdeList: [],
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'RECEIVE_EICFS':
      return {
        ...state,
        ecifList: dataMapper(action.payload || []),
        total: action.payload.length,
        loading: false,
      };
    case 'REQUEST_EICFS':
      return {
        ...state,
        loading: true,
        error: false,
      };
    case 'RECEIVE_EICFS_PUBLISHED':
      return {
        ...state,
        ecifPublished: dataMapper(action.payload || []),
        loading: false,
        error: false,
      };
    case 'FAILURE_EICFS':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'REQUEST_ICF_CDE':
      return {
        ...state,
        loading: true,
      };
    case 'SET_ICF_CDE':
      return {
        ...state,
        loading: false,
        ecifCdeList: CDEDataMapper(action.payload) || [],
      };
    case 'SELECTED_REQUIRED_CDES':
      return {
        ...state,
        ecifCdeList: [...requiredCDEListUpdate(action.payload, state.ecifCdeList)],
      };
    default:
      return state;
  }
};

export const dataMapper = (data) => {
  if (data && data.length) {
    return data.reduce((prevResult, currentItem, index) => {
      const matched = prevResult.find((el) => el.version === currentItem.version && el.name === currentItem.name);
      if (matched) {
        prevResult.map((elm) => {
          if (elm.id === matched.id) {
            elm.languageList = `${matched.language} & ${currentItem.language}`;
            elm.body = matched.language === 'English' ? matched.body : currentItem.body; //form need english eicf
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

const CDEDataMapper = (data) => {
  let CDEs = [];
  try {
    // Extracting all available languages
    let languages = data.map((question) => question.language);
    languages = [...new Set(languages)]; // removing duplicates

    //Preapering seprate array for each language

    languages.forEach((language) => {
      const questions = data.filter((question) => question?.language === language);
      CDEs.push({ language, questions });
    });
    CDEs.map((language) => {
      language.questions.map((question) => {
        question.childrens = rec(question, language.questions);
      });
    });
    CDEs.map((language) => {
      language.questions = language.questions.filter((question) => !question?.linked_variable_name?.length);
    });
  } catch (err) {
    console.log('err', err);
  }
  return CDEs;
};
function rec(question, childrens) {
  let childQuestions = [];
  (function recursive(que) {
    childrens.map((ch) => {
      if (ch?.linked_variable_name?.includes(que?.variable_name)) {
        childQuestions.push(ch);
        recursive(ch);
      }
    });
  })(question);
  return childQuestions;
}

const requiredCDEListUpdate = ({ oldCDE, selectedCDE }, list) => {
  // console.log('list', list);
  let childQuestionsCDEs = [];
  let oldChildQuestionsCDEs = [];
  if (selectedCDE?.childrens) {
    childQuestionsCDEs = selectedCDE?.childrens.map((child) => child.variable_name);
  }
  if (oldCDE?.childrens) {
    oldChildQuestionsCDEs = oldCDE?.childrens.map((child) => child.variable_name);
  }
  list.map((cde) => {
    if (oldCDE && oldCDE.variable_name === cde?.variable_name) {
      cde.selected = false;
    }
    if (oldChildQuestionsCDEs?.length && oldChildQuestionsCDEs?.includes(cde.variable_name)) {
      cde.selected = false;
    }
    if (selectedCDE && selectedCDE.variable_name === cde?.variable_name) {
      console.log('selectedCDE', selectedCDE);
      cde.selected = true;
    }
    if (childQuestionsCDEs?.length && childQuestionsCDEs?.includes(cde?.variable_name)) {
      let parents = list.filter((child) => cde?.linked_variable_name?.includes(child?.variable_name) && !child?.selected);
      if (!parents.length) {
        cde.selected = true;
      }
    }
    return cde;
  });
  return list;
};
