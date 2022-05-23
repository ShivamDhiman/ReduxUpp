import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import NumericInputQuestion from './NumericInputQuestion';
import RadioQuestion from './RadioQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import DateTimeQuestion from './DateTimeQuestion';
import TimeQuestion from './TimeQuestion';
import DropDownQuestion from './DropdownQuestion';
// import { ALBHABETS } from '../../constants/constant';
import * as moment from 'moment';
import TextInputQuestion from './TextInputQuestion';
import { ALBHABETS } from '../../../constants/constant';
const getOptions = (type, que, handleChange, index) => {
  switch (type) {
    case 'Radio Button':
      return <RadioQuestion handleChange={handleChange} que={que} index={index} />;
    case 'Multiple Choice':
      return <MultipleChoiceQuestion handleChange={handleChange} que={que} index={index} />;
    case 'Text Box':
      return <TextInputQuestion que={que} handleChange={handleChange} />;
    case 'Number':
      return <NumericInputQuestion que={que} handleChange={handleChange} />;
    case 'DateTime':
      return <DateTimeQuestion que={que} dateTime={true} handleChange={handleChange} />;
    case 'Date':
      return <DateTimeQuestion que={que} handleChange={handleChange} />;
    case 'Time':
      return <TimeQuestion que={que} handleChange={handleChange} />;
    case 'Descriptive':
      return <legend>{que?.question}</legend>;
    case 'Dropdown':
      return <DropDownQuestion que={que} handleChange={handleChange} index={index} />;
    default:
      return false;
  }
};

export const bitWiseOperatorCheck = (conditions) => {
  if (!conditions?.length) {
    return false;
  }
  if (conditions?.length === 1) {
    return conditions[0];
  }
  let ans = '';
  conditions.forEach((ele, index) => {
    if (['AND', 'OR'].includes(ele)) {
      let comparator = index > 1 ? ans : conditions[index - 1];
      if (ele === 'AND') {
        ans = comparator && conditions[index + 1];
      }
      if (ele === 'OR') {
        ans = comparator || conditions[index + 1];
      }
    }
  });
  return ans;
};

export const verifyNestedConditionMatch = (
  allQuestions,
  childQuestion,
  currentQuestion,
  currentQuestionResp,
  isSurveyPage
) => {
  const allConditions = childQuestion.question_attributes_list || {};
  const allResult = []; //ex [true,'AND', true,'OR', true ];
  // const currentQuestionCondition = childQuestion.question_attributes_list[currentQuestion.variable_name];

  for (const [key, value] of Object.entries(allConditions)) {
    if (value instanceof Array) {
      const getThisQuestion = allQuestions.find((ele) => ele.variable_name === key);
      if (getThisQuestion) {
        const thisQuestionAnswer = getThisQuestion.answer; // currentQuestion.variable_name === getThisQuestion.variable_name ? currentQuestionResp : getThisQuestion.answer;
        if (!thisQuestionAnswer) {
          allResult.push(false);
        }
        if (thisQuestionAnswer) {
          if (['Multiple Choice', 'Radio Button', 'Dropdown'].includes(getThisQuestion.response_type) && value?.length) {
            const listValues = value.reduce((result, acc) => {
              return [...result, Object.values(acc)[0]?.replace('==', '')];
            }, []);

            let isCorrect = '';
            if (thisQuestionAnswer instanceof Array) {
              // 'Multiple Choice'
              isCorrect = listValues?.every((ans) => thisQuestionAnswer.includes(ans));
            } else {
              // console.log(listValues, thisQuestionAnswer, 'notArry', isSurveyPage);
              if (isSurveyPage) {
                // on survey we are getting , separated answer label
                const formatedThisQuesAnswer = [];
                let ansLabelArray = [];
                if (getThisQuestion.response_type != 'Radio Button') {
                  ansLabelArray = thisQuestionAnswer?.split(','); //['asian','white']; >"choice_label": replace to "choice_value"
                } else {
                  ansLabelArray = [thisQuestionAnswer];
                }
                getThisQuestion?.FSQAttributes?.forEach((attb) => {
                  if (ansLabelArray.includes(attb?.choice_label)) {
                    formatedThisQuesAnswer.push(attb?.choice_value);
                  }
                });
                // now check me
                // console.log(
                //   'listValues',
                //   listValues,
                //   'formatedThisQuesAnswer',
                //   formatedThisQuesAnswer,
                //   'thisQuestionAnswer',
                //   thisQuestionAnswer
                // );
                isCorrect = listValues?.every((ans) => formatedThisQuesAnswer.includes(ans));
              } else {
                isCorrect = listValues?.includes(thisQuestionAnswer);
              }
            }
            allResult.push(isCorrect);
          }
          if (['Number'].includes(getThisQuestion.response_type) && value?.length) {
            let isCorrect = '';
            let min, max;
            const [operatorLabel, operatorValue] = Object.entries(value[0])[0];
            // console.log(operatorLabel, operatorValue, Object.entries(value[0])[0]);
            const selectedOperator = operatorLabel?.replace('number_', '');
            min = parseInt(operatorValue?.replace(selectedOperator, ''));
            switch (selectedOperator) {
              case 'Range':
                min = parseInt(operatorValue?.split('-')[0]);
                max = parseInt(operatorValue?.split('-')[1]);
                if (min <= thisQuestionAnswer && thisQuestionAnswer <= max) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
              case '<=':
                if (thisQuestionAnswer <= min) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
              case '>=':
                if (thisQuestionAnswer >= min) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
              case '=':
                if (min == thisQuestionAnswer) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
            }
            // now update correct status
            allResult.push(isCorrect);
          }
          //Time will handle later
          if (['DateTime', 'Date'].includes(getThisQuestion.response_type) && value?.length) {
            let isCorrect = '';
            let min, max;
            const [operatorLabel, operatorValue] = Object.entries(value[0])[0];
            // console.log(operatorLabel, operatorValue, Object.entries(value[0])[0]);
            const selectedOperator = operatorLabel?.replace(`${getThisQuestion.response_type}_`, '');
            min = moment(operatorValue?.replace(selectedOperator, ''));
            let SelectedDate = moment(thisQuestionAnswer);
            switch (selectedOperator) {
              case 'Range':
                min = moment(operatorValue?.split('-')[0]);
                max = moment(operatorValue?.split('-')[1]);
                if (min.isSameOrBefore(SelectedDate) && SelectedDate.isSameOrBefore(max)) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
              case '<=':
                if (SelectedDate.isSameOrBefore(min)) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
              case '>=':
                if (SelectedDate.isSameOrAfter(min)) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
              case '=':
                if (min.isSame(SelectedDate)) {
                  isCorrect = true;
                } else {
                  isCorrect = false;
                }
                break;
            }
            // now update correct status
            allResult.push(isCorrect);
          }
        }
      }
    } else {
      allResult.push(value);
    }
  }

  // return your condition match result array
  return allResult;
};

const QuestionsComponent = React.memo(({ questionsData }) => {
  const [questions, setQuestions] = useState([]);
  const [visibleQuestions, setVisibleQuestions] = useState([]);
  useEffect(() => {
    if (questionsData.FSQuestions) {
      questionsData?.FSQuestions.map((question, index) => {
        question.selectedOptions = [];
        questionsData.FSQuestions[index].visible = !question.linked_variable_name?.length;
      });

      const root = questionsData?.FSQuestions.filter((que) => !que.linked_variable_name?.length);
      const child = questionsData?.FSQuestions.filter((que) => que?.linked_variable_name?.length);
      let qList = [];
      root.forEach((rQue) => {
        qList.push(rQue);
        let childQuestionletterIndex = 0;
        child.forEach((cQue) => {
          if (cQue.linked_variable_name.includes(rQue.variable_name)) {
            cQue.visible = rQue.descriptive;
            if (rQue.descriptive) {
              // cQue.queNo = ALBHABETS[childQuestionletterIndex];
              childQuestionletterIndex++;
              cQue.isDescriptiveChild = true;
              child.forEach((cQ, index) => {
                if (cQ.linked_variable_name.includes(cQue.variable_name)) {
                  // child[index].queNo = ALBHABETS[childQuestionletterIndex];
                  childQuestionletterIndex++;
                  child[index].isDescriptiveChild = true;
                }
              });
            }
            qList.push(cQue);
          } else {
            qList.push(cQue); //to load third level on preview
          }
        });
      });
      // We are removing duplicate child questions and putting its only last occurence
      qList = [...new Set(qList?.reverse()?.map(JSON.stringify))]?.reverse()?.map(JSON.parse);

      setQuestions(qList);
    }
  }, [questionsData?.FSQuestions]);

  useEffect(() => {
    setTimeout(() => {
      const visible = questions.filter((que) => que.visible);
      setVisibleQuestions(visible);
    }, 100);
  }, [questions]);

  const handleChange = (e, que) => {
    let { value } = e.target;
    if (que.child_node) {
      let modifiedQuestions = [];
      modifiedQuestions = questions.map((question, questionIndex) => {
        // set answer for futire check
        if (question.variable_name === que.variable_name) {
          if (que.response_type === 'Multiple Choice') {
            if (e.target.checked) {
              que?.selectedOptions && que?.selectedOptions?.length
                ? que.selectedOptions.push(value)
                : (que.selectedOptions = [value]);
            } else {
              const index = que?.selectedOptions?.indexOf(value);
              if (index > -1) {
                que?.selectedOptions?.splice(index, 1);
              } else {
                que.selectedOptions = [];
              }
            }
            question.selectedOptions = que.selectedOptions;
            question.answer = que.selectedOptions;
            questions[questionIndex].answer = que.selectedOptions;
            questions[questionIndex].selectedOptions = que.selectedOptions;
          } else {
            question.answer = value;
            questions[questionIndex].answer = value;
          }
        }
      });
      modifiedQuestions = questions.map((question, questionIndex) => {
        //single level one parent condition check
        if (
          question.linked_variable_name?.length &&
          question.linked_variable_name.includes(que.variable_name) &&
          question.question_attributes_list
        ) {
          // resuable method to get all matched result;
          const shouldVisible = verifyNestedConditionMatch(questions, question, que, value, false);
          // console.log(shouldVisible, 'shouldVisible');
          if (question.linked_variable_name?.length && shouldVisible?.length) {
            question.visible = bitWiseOperatorCheck(shouldVisible);
            questions[questionIndex].visible = question.visible;
          }
        }
        return question;
      });

      setQuestions(modifiedQuestions);
    } else {
      if (que.response_type === 'Multiple Choice') {
        let modifiedQuestions = [];
        if (e.target.checked) {
          que?.selectedOptions && que?.selectedOptions?.length
            ? que.selectedOptions.push(value)
            : (que.selectedOptions = [value]);
        } else {
          const index = que?.selectedOptions?.indexOf(value);
          if (index > -1) {
            que?.selectedOptions?.splice(index, 1);
          } else {
            que.selectedOptions = [];
          }
        }
        modifiedQuestions = questions.map((question) => {
          if (question.variable_name === que.variable_name) {
            question.selectedOptions = que.selectedOptions;
            question.answer = que.selectedOptions; //for same answer key
          }
          return question;
        });
        setQuestions(modifiedQuestions);
      } else if (['Number', 'Text Box', 'Date', 'DateTime', 'Time'].includes(que.response_type)) {
        let modifiedQuestions = questions.map((question) => {
          if (question.variable_name === que.variable_name) {
            question.answer = value;
          }
          return question;
        });
        setQuestions(modifiedQuestions);
      } else {
        // handle answer for radio type question
        let modifiedQuestions = questions.map((question, questionIndex) => {
          if (question.variable_name === que.variable_name) {
            que.answer = value;
            questions[questionIndex].answer = value;
          }
          return question;
        });
        setQuestions(modifiedQuestions);
      }
    }
  };
  let questionNumber = 0;
  let childQuestionletterIndex = -2;
  return (
    <>
      <div className={`custom-scroll ${styles['question-section-preview']}`}>
        {visibleQuestions?.map((que, index) => {
          if (!que.isDescriptiveChild && que.response_type != 'Descriptive') {
            childQuestionletterIndex = -2;
          } else {
            childQuestionletterIndex++;
          }
          questionNumber = que?.isDescriptiveChild ? questionNumber : questionNumber + 1;
          return (
            <div key={`${index}`} className={`${styles.question} d-flex`}>
              <div id={styles.listing} className={que.isDescriptiveChild ? 'ps-5 me-4' : 'me-4'}>
                {que.isDescriptiveChild ? ALBHABETS[childQuestionletterIndex] : questionNumber}
              </div>
              <div className={que.isDescriptiveChild ? 'ps-5' : ''}>
                {getOptions(que?.response_type, que, handleChange, index)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
});

export default QuestionsComponent;
