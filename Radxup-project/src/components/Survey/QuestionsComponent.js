import React from 'react';
import { Col, Row, Form } from 'react-bootstrap';
import styles from '../../stylesheets/SurveyForm.module.scss';
import DateTimeQuestion from './component/DateTimeQuestion';
import MultipleChoiceQuestion from './component/MultipleChoiceQuestion';
import NumericInputQuestion from './component/NumericInputQuestion';
import RadioQuestion from './component/RadioQuestion';
import TextInputQuestion from './component/TextInputQuestion';
import TimeQuestion from './component/TimeQuestion';
import 'react-datetime/css/react-datetime.css';
import DateQuestion from './component/DateQuestion';
import DropDownQuestion from './component/DropdownQuestion';
import { ALBHABETS } from '../../constants/constant';

const getOptions = (type, que, handleAnswer, index, fontStyle, showError, isICF) => {
  switch (type) {
    case 'Radio Button':
      return (
        <RadioQuestion
          fontStyle={fontStyle}
          que={que}
          index={index}
          handleAnswer={handleAnswer}
          showError={showError}
          isICF={isICF}
        />
      );
    case 'Text Box':
      return (
        <TextInputQuestion
          fontStyle={fontStyle}
          index={index}
          que={que}
          handleAnswer={handleAnswer}
          showError={showError}
          isICF={isICF}
        />
      );
    case 'DateTime':
      return (
        <DateTimeQuestion
          fontStyle={fontStyle}
          handleAnswer={handleAnswer}
          index={index}
          que={que}
          showError={showError}
          isICF={isICF}
        />
      );
    case 'Date':
      return (
        <DateQuestion
          fontStyle={fontStyle}
          handleAnswer={handleAnswer}
          index={index}
          que={que}
          showError={showError}
          isICF={isICF}
        />
      );
    case 'Multiple Choice':
      return (
        <MultipleChoiceQuestion
          fontStyle={fontStyle}
          index={index}
          handleAnswer={handleAnswer}
          que={que}
          showError={showError}
          isICF={isICF}
        />
      );
    case 'Number':
      return (
        <NumericInputQuestion
          fontStyle={fontStyle}
          index={index}
          que={que}
          handleAnswer={handleAnswer}
          showError={showError}
          isICF={isICF}
        />
      );
    case 'Time':
      return (
        <TimeQuestion
          fontStyle={fontStyle}
          index={index}
          handleAnswer={handleAnswer}
          que={que}
          showError={showError}
          isICF={isICF}
        />
      );
    case 'Descriptive':
      return <legend>{que?.question}</legend>;
    case 'Dropdown':
      return (
        <DropDownQuestion
          fontStyle={fontStyle}
          handleAnswer={handleAnswer}
          index={index}
          que={que}
          showError={showError}
          isICF={isICF}
        />
      );
    default:
      return null;
  }
};

const QuestionsComponent = React.memo(
  ({ step, questions, handleAnswer, fontStyle, sections, onSectionChange, showOnly = false, showError, isICF }) => {
    let questionNumber = 0;
    let childQuestionletterIndex = -2;
    const questionContent = (que, index) => {
      if (!que.isDescriptiveChild && que.response_type != 'Descriptive') {
        childQuestionletterIndex = -2;
      } else {
        childQuestionletterIndex++;
      }
      questionNumber = que?.isDescriptiveChild ? questionNumber : questionNumber + 1;
      return (
        <div key={`${step} ${que.id}`} className={`${styles.question} d-flex ${que?.isDescriptiveChild ? 'ps-5' : ''}`}>
          <div sm={1} id={styles.listing} className="mx-4">
            {que?.isDescriptiveChild ? ALBHABETS[childQuestionletterIndex] : questionNumber}
          </div>
          <div sm={11} className={que?.isDescriptiveChild ? 'ps-5' : ''}>
            {!showOnly ? (
              getOptions(que.response_type, que, handleAnswer, index, fontStyle, showError, isICF)
            ) : (
              <div className={'d-flex flex-column'}>
                <lable className={`${fontStyle?.questionStyle} ${styles.questionText}`}>{que.question}</lable>
                <div className={'my-2'}>
                  <lable className={``}>{que.not_to_ans ? 'Preferred not to answer' : que.answer}</lable>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    const getChild = (parent, ques) => {
      let variable_name = parent?.variable_name;
      let arr = ques.filter((que) => que.linked_variable_name?.includes(variable_name) && que.isVisible);
      return arr;
    };

    const getIndex = (variable_name) => {
      return questions[step]?.FSQuestions.findIndex((item) => item.variable_name === variable_name);
    };

    // const getQuestion = (ques) => {
    //   let questions = ques?.filter(
    //     (que) => !que?.linked_variable_name?.length || (que?.linked_variable_name?.length && que.isVisible)
    //   );
    //   questions.forEach((item, i) => {
    //     let children = getChild(item, ques);
    //     children.forEach((child) => {
    //       let ind = questions.findIndex((q) => q.variable_name === child.variable_name);
    //       questions.splice(ind, 1);
    //       questions.splice(i + 1, 0, child);
    //     });
    //   });
    //   questions = questions.map((que) => questionVisiblity(que, getIndex(que.variable_name)));
    //   return questions;
    // };

    const questionVisiblity = (que, index) => {
      if (!que?.linked_variable_name?.length) {
        return questionContent(que, index);
      } else if (que?.linked_variable_name?.length && que?.isVisible) {
        return questionContent(que, index);
      } else {
        return null;
      }
    };
    return (
      <>
        {!isICF && (
          <Form.Select
            className={`${styles['questions-header']}`}
            value={step}
            onChange={onSectionChange}
            aria-label="Default select form"
          >
            {questions
              ?.filter((sec) => sec?.isVisible)
              .map((item, index) => {
                return (
                  <option value={index} key={index}>
                    SECTION {index + 1} OF {sections} : {item.name}
                  </option>
                );
              })}
          </Form.Select>
        )}
        <div className={`custom-scroll ${styles['question-section']}`}>
          {isICF
            ? questions.map((que, index) => questionVisiblity(que, index))
            : questions[step]?.FSQuestions.map((que, index) => questionVisiblity(que, index))}
        </div>
        {/* <div className={`custom-scroll ${styles['question-section']}`}>{getQuestion(questions[step]?.FSQuestions)}</div> */}
      </>
    );
  }
);

QuestionsComponent.defaultProps = {
  questions: [],
};

export default QuestionsComponent;
