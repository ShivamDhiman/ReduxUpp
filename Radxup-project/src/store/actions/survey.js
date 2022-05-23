import API from '../../helpers/api';
import { get } from 'lodash';
import { contentSecurityPolicy } from 'helmet';
import store from '../index';
import { toast } from 'react-toastify';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { bitWiseOperatorCheck, verifyNestedConditionMatch } from '../../components/Forms/QuestionsComponent';

function requestForms() {
  return {
    type: 'REQUEST_FORMS_DATA',
  };
}

function requestSubmit() {
  return {
    type: 'REQUEST_SUBMIT_DATA',
  };
}

function errorForms(err) {
  let data = get(err, 'response.data', null);
  data = data || get(err, 'response');
  data = data || err;

  return (dispatch) => {
    dispatch({
      type: 'FAILURE_FORMS_DATA',
      payload: err,
    });
  };
}

export function setFormData(token) {
  return (dispatch) => {
    dispatch(requestForms());
    API.apiGet('surveyInfo', `?query=${token}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_FORMS_DATA`, payload: response.data.data });
        }
      })
      .catch((err) => {
        errorForms(err)(dispatch);
      });
  };
}

export function clearFormData() {
  return (dispatch) => {
    dispatch({ type: `RECEIVE_FORMS_DATA`, payload: null });
  };
}

export function submitSurvey(encodedPayload, token, draftDataName = '') {
  return (dispatch) => {
    const headers = {
      version: 'v1',
      authorization: token,
    };
    API.apiPost('surveySubmit', { payload: encodedPayload }, { headers })
      .then((response) => {
        if (response.data && response.data.success === true) {
          dispatch({ type: `SUBMIT_SUCCESS` });
          toast.success(response.data.message);
          localStorage.removeItem(draftDataName);
        }
      })
      .catch((error) => {
        handleErrorMessage(error);
        errorForms(error)(dispatch);
      });
  };
}

function updateQuestionVisiblity(dispatch, questionData, variable_name, sectionIndex, choice_key, ans) {
  let _tempQuestionData = questionData;
  const englishSectionList = _tempQuestionData?.surveyForm?.find((el) => el.language === 'English')?.FormsSections || [];
  const spanishSectionList = _tempQuestionData?.surveyForm?.find((el) => el.language === 'Spanish')?.FormsSections || [];

  let englistQuestionList = englishSectionList[sectionIndex]?.FSQuestions;
  let spanishQuestionList = spanishSectionList[sectionIndex]?.FSQuestions;
  let parentEngQuestion = englistQuestionList.find((que) => que.variable_name === variable_name);

  let nextSection = englishSectionList[sectionIndex + 1];

  //handle branching section visiblity
  if (nextSection && nextSection?.linked_variable_name?.includes(variable_name)) {
    const checkIsVisibleCondition = verifyNestedConditionMatch(
      englistQuestionList,
      nextSection,
      questionData,
      ans,
      'isSurveyPage'
    );
    const checkIsVisible = bitWiseOperatorCheck(checkIsVisibleCondition);
    // console.log(checkIsVisibleCondition, checkIsVisible, nextSection.question_attributes_list);
    nextSection.isVisible = checkIsVisible;
    //update in spanish section as well
    if (spanishSectionList?.length) {
      spanishSectionList[sectionIndex + 1].isVisible = checkIsVisible;
    }
  }

  const englishQuestionsLength = englistQuestionList.length;
  for (let i = 0; i < englishQuestionsLength; i++) {
    let englishQuestion = englistQuestionList[i];
    let spanishQuestion = null;
    if (spanishQuestionList) {
      spanishQuestion = spanishQuestionList[i];
    }

    // console.log(
    //   englishQuestion,
    //   englishQuestion.linked_variable_name?.includes(variable_name),
    //   variable_name,
    //   'verifyNestedConditionMatch'
    // );

    if (englishQuestion.linked_variable_name?.includes(variable_name)) {
      const checkIsVisibleCondition = verifyNestedConditionMatch(
        englistQuestionList,
        englishQuestion,
        questionData,
        ans,
        'isSurveyPage'
      );
      // console.log(checkIsVisibleCondition, englishQuestion, parentEngQuestion);
      const checkIsVisible = bitWiseOperatorCheck(checkIsVisibleCondition);
      englishQuestion.isVisible = checkIsVisible;
      if (!checkIsVisible && parentEngQuestion.response_type !== 'Descriptive') {
        englishQuestion.answer = '';
      }

      if (spanishQuestion) {
        let answerObj = !checkIsVisible ? { answer: '' } : {};
        spanishQuestion = { ...spanishQuestion, isVisible: checkIsVisible, ...answerObj };
      }
      if (checkIsVisible) {
        let childEngQuestionIndex = englistQuestionList.findIndex(
          (que) => que.variable_name === englishQuestion.variable_name
        );

        let removed = englistQuestionList.splice(childEngQuestionIndex, 1);
        let parentEngQuestionIndex = englistQuestionList.findIndex((que) => que.variable_name === variable_name);
        englistQuestionList.splice(parentEngQuestionIndex + 1, 0, ...removed);
        if (spanishQuestion && spanishQuestionList) {
          let childEngQuestionIndex = spanishQuestionList.findIndex(
            (que) => que.variable_name === englishQuestion.variable_name
          );

          let removed = spanishQuestionList.splice(childEngQuestionIndex, 1);
          removed[0].isVisible = checkIsVisible; /// changed this only
          let parentEngQuestionIndex = spanishQuestionList.findIndex((que) => que.variable_name === variable_name);
          spanishQuestionList.splice(parentEngQuestionIndex + 1, 0, ...removed);
        }
      } else {
        spanishQuestionList.map((item, i) => {
          if (item.variable_name === spanishQuestion.variable_name) {
            spanishQuestionList[i].isVisible = false;
          }
        });
      }

      // If question type is descriptive then display questions, this is used in case of datamanagement
      if (parentEngQuestion.response_type == 'Descriptive') {
        englishQuestion.isVisible = true;
        spanishQuestion ? (spanishQuestion.isVisible = true) : '';
      }
      // if (parentEngQuestion && parentEngQuestion.response_type === 'Number') {
      //   const valueInNumericInput = parseInt(ans);
      //   const min = parseInt(englishQuestion.question_attributes_list[0]);

      //   switch (englishQuestion.question_attributes_label[0]) {
      //     case 'Range':
      //       const max = englishQuestion.question_attributes_list[1];
      //       if (min <= valueInNumericInput && valueInNumericInput <= max) {
      //         englishQuestion.isVisible = true;
      //       } else {
      //         englishQuestion.isVisible = false;
      //       }
      //       break;
      //     case '<=':
      //       if (valueInNumericInput <= min) {
      //         englishQuestion.isVisible = true;
      //       } else {
      //         englishQuestion.isVisible = false;
      //       }
      //       break;
      //     case '>=':
      //       if (valueInNumericInput >= min) {
      //         englishQuestion.isVisible = true;
      //       } else {
      //         englishQuestion.isVisible = false;
      //       }
      //       break;
      //     case '=':
      //       if (min == valueInNumericInput) {
      //         englishQuestion.isVisible = true;
      //       } else {
      //         englishQuestion.isVisible = false;
      //       }
      //       break;
      //   }
      //   if (spanishQuestion) {
      //     spanishQuestion = { ...spanishQuestion, isVisible: englishQuestion.isVisible };
      //   }
      // } else {
      //   let current_choice_key = englishQuestion.question_attributes_list?.sort().join();

      //   if (JSON.stringify(current_choice_key) === JSON.stringify(choice_key)) {
      //     englishQuestion = { ...englishQuestion, isVisible: true };
      //     if (spanishQuestion) {
      //       spanishQuestion = { ...spanishQuestion, isVisible: true };
      //     }
      //   } else {
      //     englishQuestion = { ...englishQuestion, isVisible: false };
      //     if (spanishQuestion) {
      //       spanishQuestion = { ...spanishQuestion, isVisible: false };
      //     }
      //   }
      //   englistQuestionList[i] = englishQuestion;
      //   if (spanishQuestionList) {
      //     spanishQuestionList[i] = spanishQuestion;
      //   }
      // }
    }
  }

  _tempQuestionData.surveyForm[0].FormsSections[sectionIndex].FSQuestions = englistQuestionList;
  if (spanishQuestionList) {
    _tempQuestionData.surveyForm[1].FormsSections[sectionIndex].FSQuestions = spanishQuestionList;
  }
  dispatch({ type: `RECEIVE_FORMS_DATA_UPDATE`, payload: _tempQuestionData });
}

export function updateAnswer(ans, questionIndex, key = 'answer', sectionIndex, choice_key, not_to_ans) {
  // console.log(ans);
  return (dispatch) => {
    const questionData = store.getState()?.survey?.questionData;
    let _tempQuestionData = { ...questionData };
    let surveyFormEnglist = [..._tempQuestionData.surveyForm[0].FormsSections];
    let englishQuestion = surveyFormEnglist[sectionIndex].FSQuestions[questionIndex];
    if (key === 'answer' && typeof not_to_ans === 'boolean') {
      englishQuestion = { ...englishQuestion, [key]: ans, not_to_ans };
    } else {
      englishQuestion = { ...englishQuestion, [key]: ans };
    }
    if (englishQuestion.child_node) {
      if (choice_key == 'null' || !choice_key) {
        englishQuestion = { ...englishQuestion, choice_key: '' };
      } else {
        if (choice_key) {
          englishQuestion = { ...englishQuestion, choice_key: choice_key };
        }
      }
    }
    surveyFormEnglist[sectionIndex].FSQuestions[questionIndex] = englishQuestion;
    _tempQuestionData.surveyForm[0].FormsSections = surveyFormEnglist;
    if (_tempQuestionData.surveyForm[1]) {
      let surveyFormSpanish = [..._tempQuestionData.surveyForm[1].FormsSections];
      let spanishQuestion = surveyFormSpanish[sectionIndex].FSQuestions[questionIndex];
      if (key === 'answer' && typeof not_to_ans === 'boolean') {
        spanishQuestion = { ...spanishQuestion, [key]: ans, not_to_ans };
      } else {
        spanishQuestion = { ...spanishQuestion, [key]: ans };
      }

      // filling choice for spanish as well  in update answer
      if (spanishQuestion.child_node) {
        if (choice_key == 'null' || !choice_key) {
          spanishQuestion = { ...spanishQuestion, choice_key: '' };
        } else {
          if (choice_key) {
            spanishQuestion = { ...spanishQuestion, choice_key: choice_key };
          }
        }
      }
      surveyFormSpanish[sectionIndex].FSQuestions[questionIndex] = spanishQuestion;
      _tempQuestionData.surveyForm[1].FormsSections = surveyFormSpanish;
    }
    // console.log(englishQuestion, 'ques');
    if (englishQuestion?.child_node || englishQuestion?.linked_level > 0) {
      updateQuestionVisiblity(
        dispatch,
        _tempQuestionData,
        englishQuestion.variable_name,
        sectionIndex,
        englishQuestion.choice_key,
        ans
      );
    }
    dispatch({ type: `RECEIVE_FORMS_DATA_UPDATE`, payload: _tempQuestionData });
  };
}

export function updateQuesFromStore(qpayload) {
  return (dispatch) => {
    dispatch({ type: `RECEIVE_FORMS_DATA_UPDATE`, payload: qpayload });
  };
}

export const fetchSurveyData = (payload) => {
  return () => {
    return API.apiGetByKey('surveyDetails', `?query=${payload}`)
      .then((response) => {
        if (response?.data?.success) {
          return response?.data?.data;
        }
      })
      .catch((err) => {
        // toast.error(err?.message || err);
        handleErrorMessage(err);
      });
  };
};

export const fetchFormData = (payload) => {
  return () => {
    return API.apiGetByKey('formDetails', `?payload=${payload}`)
      .then((response) => {
        if (response?.data?.data.length) {
          return response?.data?.data;
        }
        toast.error('Data Not Found');
      })
      .catch((err) => {
        handleErrorMessage(err);
        // toast.error(err?.message || err);
      });
  };
};

export function fetchSurveyStats(loading) {
  return {
    type: 'REQUEST_SURVEY_STATS',
    loading,
  };
}

export function getSyncedRecords() {
  return (dispatch) => {
    dispatch(fetchSurveyStats(true));
    API.apiGet('getSyncedRecords')
      .then((response) => {
        if (response.data && response.data.success === true) {
          dispatch({ type: `GET_SURVEY_STATS`, payload: response.data.data });
        }
        dispatch(fetchSurveyStats(false));
      })
      .catch((err) => {
        dispatch(fetchSurveyStats(false));
        handleErrorMessage(err);
      });
  };
}
