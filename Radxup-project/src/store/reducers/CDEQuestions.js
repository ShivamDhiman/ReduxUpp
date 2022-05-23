const INITIAL_STATE = {
  CDEList: [],
  CDElibrary: [],
  masterCDEList: [],
  masterCDEQuestiosnList: [],
  masterCDEUniqueCount: 0,
  requiredCDEList: [],
  selectedCDEQuestions: 0,
  loading: false,
  total: 0,
  error: false,
  cdeSummary: {
    Adult: {
      cdeCount: 0,
      studyCDECount: 0,
      cdeUsedCount: 0,
    },
    Pediatric: {
      cdeCount: 0,
      studyCDECount: 0,
      cdeUsedCount: 0,
    },
  },
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'RECEIVE_CDES':
      return {
        ...state,

        total: action.payload.length,
        loading: false,
        masterCDEList: cdeDataMapper(action.payload || []),
        CDElibrary: action.payload,
        masterCDEQuestiosnList: action.payload || [],
        masterCDEUniqueCount: getCount(action.payload),
      };
    case 'FORMAT_CEE':
      return {
        ...state,
        masterCDEList: cdeDataMapper(action.payload || []),
        masterCDEUniqueCount: getCount(action.payload),
        CDElibrary: action.payload,
      };
    case 'REQUEST_CDES':
      return {
        ...state,
        loading: true,
        error: false,
      };
    case 'FAILURE_CDES':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'SELECTED_REQUIRED_CDES':
      return {
        ...state,
        // requiredCDEList: [...requiredCDEListUpdate(action.payload, state.requiredCDEList)],
        CDEList: [...requiredCDEListUpdate(action.payload, state.CDEList)],
      };
    case 'SELECTED_CDES':
      return {
        ...state,
        CDEList: [...selectedCDEUpdate(action.payload, state.CDEList)],
      };
    case 'UPDATE_SELECTED_CDES':
      return {
        ...state,
        // requiredCDEList: [...action.payload],
        CDEList: [...markSelectedIfUsed(action.payload)],
      };
    case 'SUMMARY_CDES':
      return {
        ...state,
        cdeSummary: { ...action.payload },
      };
    case 'RECEIVE_FORM_CDES':
      return {
        ...state,
        // CDEList: dataMapper(action.payload?.cde || [], true),
        CDEList: reDataMapper(action.payload?.cde || [], true),

        requiredCDEList: requiredCDEListMapper(action.payload?.cde || []),
        cdeTemplate: formDataMapper(action.payload?.template || [], action.query),
      };

    case 'CLEAN_CDES':
      return {
        ...INITIAL_STATE,
      };

    default:
      return state;
  }
};

const getCount = (masterCDEList) => {
  let questions = [];
  masterCDEList.forEach((section) => {
    questions = [...questions, ...section.CDEQuestions];
  });
  let questionsVariableNames = questions.map((que) => que.variable_name);
  let totalQuestions = [...new Set(questionsVariableNames)].length;
  return totalQuestions;
};
const markSelectedIfUsed = (list) => {
  if (list?.length) {
    // list = list.map((que) => {
    //   if (que.variable_used) {
    //     que.selected = true;
    //   }
    //   return que;
    // });
    // list = list.filter((que) => !que.variable_used);
  }
  return list;
};
const dataMapper = (data, isFomatingFormCDElist) => {
  try {
    let formattedRoots = [];
    let formattedChildrens = [];
    if (data && data.length) {
      data = markSelectedIfUsed(data);
      const rootQuestions = data.filter((question) => !question?.linked_variable_name?.length);
      const childrens = data.filter((question) => question?.linked_variable_name?.length);
      const rootQuestionsGroups = groupBy(rootQuestions, 'variable_name');

      const childQuestionsGroups = groupBy(childrens, 'variable_name');
      Object.entries(childQuestionsGroups).map(([key, values]) => {
        formattedChildrens.push(getFormattedGroup(values, key, [], isFomatingFormCDElist));
      });

      Object.entries(rootQuestionsGroups).map(([key, values]) => {
        formattedRoots.push(getFormattedGroup(values, key, formattedChildrens, isFomatingFormCDElist, data));
      });
    }
    return formattedRoots;
  } catch (e) {
    console.log('e', e);
  }
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
const reDataMapper = (data) => {
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
const cdeDataMapper = (data) => {
  try {
    let formattedRoots = [];
    for (let i = 0; i < data.length; i++) {
      let section = { ...data[i] };
      let CDEQuestions = dataMapper(data[i].CDEQuestions);
      section = { ...section, CDEQuestions };
      formattedRoots.push(section);
    }
    return formattedRoots;
  } catch (e) {
    console.log('e', e);
  }
};

const groupBy = (arr, key) => {
  return arr.reduce((groups, item) => {
    const group = groups[item[key]] || [];
    group.push(item);
    groups[item[key]] = group;
    return groups;
  }, []);
};

let queArray = [];
const getFormattedGroup = (values, key, childrens = [], isFomatingFormCDElist, data) => {
  let englishQuestions = values.filter((que) => que.language === 'English');
  let englistAdult = englishQuestions.find((que) => que.category === 'Adult');
  let englistPeadiatric = englishQuestions.find((que) => que.category === 'Pediatric');
  let spanishQuestions = values.filter((que) => que.language === 'Spanish');
  let spanishAdult = spanishQuestions.find((que) => que.category === 'Adult');
  let spanishPeadiatric = spanishQuestions.find((que) => que.category === 'Pediatric');
  // Searching recursively and finding childs at nested level
  function rec(question) {
    let childQuestions = [];
    (function recursive(que) {
      childrens.map((ch) => {
        if (ch.English?.linked_variable_name?.includes(que?.variable_name)) {
          childQuestions.push(ch);
          recursive(ch.English);
        }
      });
    })(question);
    return childQuestions;
  }
  if (isFomatingFormCDElist) {
    let english = values.find((que) => que.language === 'English');
    let spanish = values.find((que) => que.language === 'Spanish');
    return {
      English: { ...english, question_type: 'CDE Question', cde_id: english?.id },
      Spanish: { ...spanish, question_type: 'CDE Question', cde_id: spanish?.id },
      childrens: childrens ? rec({ English: english, Spanish: spanish, variable_name: english.variable_name }) : null,
      cde_id: english?.id,
      cde_idEnglish: english?.id,
      cde_idSpanish: spanish?.id,
      required: !english.required,
      variable_name: key,
      selected: english?.selected ? english?.selected : false,
      linked_variable_name: childrens.length ? null : values[0].linked_variable_name,
      labelEnglish: english?.question,
      labelSpanish: spanish?.question,
    };
  } else {
    let queData = {
      English: {
        Adult: englistAdult,
        Peadiatric: englistPeadiatric,
        question_type: 'CDE Question',
        cde_id: englishQuestions[0]?.id,
      },
      Spanish: {
        Adult: spanishAdult,
        Peadiatric: spanishPeadiatric,
        question_type: 'CDE Question',
        cde_id: spanishQuestions[0]?.id,
      },
      childrens: childrens ? childrens.filter((child) => child?.linked_variable_name?.includes(key)) : [],
      cde_id: englishQuestions[0]?.cde_id || englishQuestions[0]?.id,
      cde_idEnglish: englishQuestions[0]?.id,
      cde_idSpanish: spanishQuestions[0]?.id,
      required: !englishQuestions[0]?.required,
      study_mapped: !englishQuestions[0]?.study_mapped,
      variable_name: key,
      linked_variable_name: childrens.length ? null : values[0].linked_variable_name,
      labelEnglish: englishQuestions[0]?.question,
      labelSpanish: spanishQuestions[0]?.question,
      question_attributes_label: englishQuestions[0]?.question_attributes_label,
    };
    let count = 0;
    if (data?.length && queData.childrens.length) {
      queData?.childrens.forEach((child) => {
        let filtered = data.filter((mQue) => mQue.linked_variable_name?.includes(child.variable_name));
        let filterLevel2 = [];
        if (filtered.length) {
          filtered.forEach((q2) => {
            filterLevel2 = data.filter((mQue) => mQue.linked_variable_name?.includes(q2.variable_name));
          });
        }
        let filterLevel2Variables = filterLevel2.map((q) => q.variable_name);
        let filteredVariables = filtered.map((que) => que.variable_name);
        count += [...new Set([...filteredVariables, ...filterLevel2Variables])]?.length;
      });
    }
    queData.selfCount = queData?.childrens?.length + 1 + count;
    // console.log('queData.selfCount', queData.selfCount, queData?.childrens?.length, count);
    return queData;
  }
};

const formDataMapper = (data, query) => {
  let requiredCDE = [];
  data.forEach((section) => {
    let qns = [];
    // section.FSQuestions = section?.FSQuestions?.filter((que) => !que.variable_used);
    section.FSQuestions.forEach((cde) => {
      if (cde.category == query.category) {
        cde.question_type = 'CDE Question';
        cde.selected = true;
        cde.FSQAttributes = cde.FSQAttributes;
        qns.push(cde);
        if (cde.child_node) {
          let find = section.FSQuestions.filter((q) => q?.linked_variable_name?.includes(cde?.variable_name));
        }
        // cde.requiredQns === true && cde.language === 'English';
      }
    });
    if (qns.length) {
      requiredCDE.push({ ...section, CDEQuestions: [...qns] });
    }
  });
  let forms = [
    {
      language: 'English',
      max_cde_question: '50',
      name: '',
      status: 'Draft',
      type: query?.category || 'Adult Form',
      FormsSections: [],
      version: '',
    },
    {
      language: 'Spanish',
      max_cde_question: '50',
      name: '',
      status: 'Draft',
      type: query?.category || 'Adult Form',
      FormsSections: [],
      version: '',
    },
  ];
  try {
    requiredCDE.forEach((section, secIndex) => {
      const rootQuestions = section.CDEQuestions.filter((question) => !question?.linked_variable_name?.length);
      const childrens = section.CDEQuestions.filter((question) => question?.linked_variable_name?.length);
      const rootQuestionsGroups = groupBy(rootQuestions, 'variable_name');
      const childQuestionsGroups = groupBy(childrens, 'variable_name');
      forms[0].FormsSections.push({
        language: 'English',
        FSQuestions: [],
        name: section?.name,
        order: section?.order,
      });
      forms[1].FormsSections.push({
        language: 'Spanish',
        FSQuestions: [],
        name: section?.name,
        order: section?.order,
      });

      // Added Parents
      Object.entries(rootQuestionsGroups).forEach(([key, values]) => {
        values.forEach((que) => {
          if (que?.language === 'English') {
            forms[0].FormsSections[secIndex].FSQuestions.push(que);
          }
          if (que?.language === 'Spanish') {
            forms[1].FormsSections[secIndex].FSQuestions.push(que);
          }
        });
      });

      //Level 1 parents
      Object.entries(childQuestionsGroups).forEach(([key, values]) => {
        let found = _.findLastIndex(forms[0].FormsSections[secIndex].FSQuestions, (que) =>
          values[0]?.linked_variable_name?.includes(que.variable_name)
        );

        if (found != -1) {
          // Level 2 parents
          let levelTwoEnglishChilds = childrens.filter(
            (child) =>
              child.linked_variable_name?.includes(values[0]?.variable_name) &&
              values[0]?.child_node &&
              values[0]?.language == 'English'
          );
          let levelTwoSpanishChilds = childrens.filter(
            (child) =>
              child.linked_variable_name?.includes(values[0]?.variable_name) &&
              values[0]?.child_node &&
              values[0]?.language == 'Spanish'
          );

          // Finding level 3 english questions
          let levelThreeEnglishChilds = [];
          levelTwoEnglishChilds.forEach((level2parent) => {
            if (level2parent.child_node)
              levelThreeEnglishChilds = childrens.filter(
                (child) => child.linked_variable_name?.includes(level2parent?.variable_name) && child?.language == 'English'
              );
          });

          // Finding level 3 spanish questions
          let levelThreeSpanishChilds = [];
          levelTwoSpanishChilds.forEach((level2parent) => {
            if (level2parent.child_node)
              levelThreeSpanishChilds = childrens.filter(
                (child) => child.linked_variable_name?.includes(level2parent?.variable_name) && child?.language == 'Spanish'
              );
          });

          // Merging level 3 english questions with its parents
          if (levelThreeEnglishChilds.length) {
            levelTwoEnglishChilds = [...levelTwoEnglishChilds, ...levelThreeEnglishChilds];
          }

          // Merging level 3 spanish questions with its parents
          if (levelThreeSpanishChilds.length) {
            levelTwoSpanishChilds = [...levelTwoSpanishChilds, ...levelThreeSpanishChilds];
          }

          values.forEach((que) => {
            que.selected = true;
            if (que?.language === 'English') {
              forms[0].FormsSections[secIndex].FSQuestions.splice(found + 1, 0, que);
              if (levelTwoEnglishChilds.length) {
                forms[0].FormsSections[secIndex].FSQuestions.splice(found + 2, 0, ...levelTwoSpanishChilds);
              }
            }
            if (que?.language === 'Spanish') {
              forms[1].FormsSections[secIndex].FSQuestions.splice(found + 1, 0, que);
              if (levelTwoEnglishChilds.length) {
                forms[1].FormsSections[secIndex].FSQuestions.splice(found + 2, 0, ...levelTwoSpanishChilds);
              }
            }
          });
        }
      });
      // if (secIndex == 2) {
      //   console.log('forms[0].FormsSections[secIndex].FSQuestions', secIndex, forms[0].FormsSections[secIndex].FSQuestions);
      // }
    });
  } catch (e) {
    console.log('e', e);
  }

  // Sorting questions as per cde template basis of order key
  forms.map((form, formIndex) => {
    form.FormsSections.map((section, secIndex) => {
      section?.FSQuestions.sort(function (a, b) {
        return a.order - b.order;
      });
      return section;
    });
    return form;
  });
  return forms;
};

export const requiredCDEListMapper = (data) => {
  let requiredCDE = data.filter((cde) => cde?.study_mapped === true && cde?.language === 'English');
  requiredCDE = requiredCDE.map((cde) => {
    return {
      ...cde,
      question_type: 'CDE Question',
      selected: false,
    };
  });
  return requiredCDE || [];
};

const requiredCDEListUpdate = ({ oldCDE, selectedCDE }, list) => {
  // console.log('list============', list);
  let childQuestionsCDEs = [];
  let oldChildQuestionsCDEs = [];
  if (selectedCDE?.childrens) {
    childQuestionsCDEs = selectedCDE?.childrens.map((child) => child.variable_name);
  }
  if (oldCDE?.childrens) {
    oldChildQuestionsCDEs = oldCDE?.childrens.map((child) => child.variable_name);
  }
  list.map((item) => {
    item.questions.map((cde) => {
      if (oldCDE && oldCDE.variable_name === cde?.variable_name) {
        cde.selected = false;
      }
      if (oldChildQuestionsCDEs?.length && oldChildQuestionsCDEs?.includes(cde.variable_name)) {
        cde.selected = false;
      }
      if (selectedCDE && selectedCDE.variable_name === cde?.variable_name) {
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
  });
  return list;
};

const selectedCDEUpdate = ({ oldCDE, selectedCDE }, list) => {
  let childQuestionsCDEs = [];
  let oldChildQuestionsCDEs = [];
  if (selectedCDE?.childrens) {
    childQuestionsCDEs = selectedCDE?.childrens.map((child) => child.variable_name);
  }
  if (oldCDE?.childrens) {
    oldChildQuestionsCDEs = oldCDE?.childrens.map((child) => child.variable_name);
  }
  list.map((item) => {
    item.questions.map((cde) => {
      if (oldCDE && oldCDE.variable_name === cde?.variable_name) {
        cde.selected = false;
      }
      if (oldChildQuestionsCDEs?.length && oldChildQuestionsCDEs?.includes(cde.variable_name)) {
        cde.selected = false;
      }
      if (selectedCDE && selectedCDE.variable_name === cde?.variable_name) {
        cde.selected = true;
      }
      if (childQuestionsCDEs?.length && childQuestionsCDEs?.includes(cde.variable_name)) {
        let parents = list.filter((child) => cde?.linked_variable_name.includes(child.variable_name) && !child.selected);
        if (!parents.length) {
          cde.selected = true;
        }
      }
      return cde;
    });
  });
  return list;
};
