import { ALBHABETS } from '../../constants/constant';

const INITIAL_STATE = {
  questionData: null,
  loading: false,
  total: 0,
  error: false,
  submiting: false,
  submitSuccess: false,
  surveyStats: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'RECEIVE_FORMS_DATA_UPDATE':
      return {
        ...state,
        questionData: action.payload,
        loading: false,
      };
    case 'RECEIVE_FORMS_DATA':
      return {
        ...state,
        questionData: dataMapper(action.payload),
        loading: false,
      };
    case 'REQUEST_FORMS_DATA':
      return {
        ...state,
        loading: true,
        error: false,
        submitSuccess: false,
      };
    case 'FAILURE_FORMS_DATA':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case 'REQUEST_SUBMIT_DATA':
      return {
        ...state,
        submiting: true,
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submiting: false,
        submitSuccess: true,
      };
    case 'REQUEST_SURVEY_STATS':
      return {
        ...state,
        loading: action.loading,
      };
    case 'GET_SURVEY_STATS':
      return {
        ...state,
        loading: false,
        surveyStats: action.payload,
      };
    default:
      return state;
  }
};

const dataMapper = (data) => {
  try {
    if (data?.surveyForm) {
      data.surveyForm.forEach((form, formIndex) => {
        form.FormsSections.map((section, sectionIndex) => {
          if (section?.linked_variable_name?.length) {
            section.isVisible = false;
          } else {
            section.isVisible = true;
          }

          let fsQuestion = [];
          const root = section?.FSQuestions.filter((que) => !que?.linked_variable_name?.length);
          const child = section?.FSQuestions.filter((que) => que?.linked_variable_name?.length);
          root.map((rQuestion, questionIndex) => {
            fsQuestion.push(rQuestion);
            const found = child.filter((que) => que?.linked_variable_name?.includes(rQuestion?.variable_name));
            let childQuestionletterIndex = 0;
            found.forEach((cQUe) => {
              //finding level 2 questions
              if (cQUe?.child_node && cQUe?.linked_variable_name?.length) {
                const level2Childs = child.filter((que) => que?.linked_variable_name?.includes(cQUe?.variable_name));
                fsQuestion = [...fsQuestion, ...level2Childs];
                level2Childs.forEach((l2Que) => {
                  //finding level 3 questions
                  if (l2Que?.child_node && l2Que?.linked_variable_name?.length) {
                    const level3Childs = child.filter((que) => que?.linked_variable_name?.includes(l2Que?.variable_name));
                    fsQuestion = [...fsQuestion, ...level3Childs];
                  }
                });
              }
              if (rQuestion.descriptive) {
                cQUe.isVisible = true;
                // cQUe.queNo = ALBHABETS[childQuestionletterIndex];
                cQUe.isDescriptiveChild = true;
                childQuestionletterIndex++;
                child.forEach((cQ, index) => {
                  if (cQ.linked_variable_name.includes(cQUe.variable_name)) {
                    // child[index].queNo = ALBHABETS[childQuestionletterIndex];
                    childQuestionletterIndex++;
                    child[index].isDescriptiveChild = true;
                  }
                });
              }
              fsQuestion.push(cQUe);
            });
          });
          // We are removing duplicate child questions and putting its only last occurence
          fsQuestion = [...new Set(fsQuestion?.reverse()?.map(JSON.stringify))]?.reverse()?.map(JSON.parse);
          section.FSQuestions = fsQuestion;
          return section;
        });
      });
    }
    return data;
  } catch (e) {
    console.log('e', e);
  }
};
