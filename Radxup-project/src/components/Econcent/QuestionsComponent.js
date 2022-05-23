import React from 'react';
import { Col, Row, Form } from 'react-bootstrap';
import styles from '../../stylesheets/SurveyForm.module.scss';
import DateTimeQuestion from '../Survey/component/DateTimeQuestion';
import MultipleChoiceQuestion from '../Survey/component/MultipleChoiceQuestion';
import NumericInputQuestion from '../Survey/component/NumericInputQuestion';
import RadioQuestion from '../Survey/component/RadioQuestion';
import TextInputQuestion from '../Survey/component/TextInputQuestion';
import TimeQuestion from '../Survey/component/TimeQuestion';
import 'react-datetime/css/react-datetime.css';
import DateQuestion from '../Survey/component/DateQuestion';
import DropDownQuestion from '../Survey/component/DropdownQuestion';
import { ALBHABETS } from '../../constants/constant';

const getOptions = (type, que, handleAnswer, index, fontStyle, showError) => {
  switch (type) {
    case 'Radio Button':
      return (
        <RadioQuestion fontStyle={fontStyle} que={que} index={index} handleAnswer={handleAnswer} showError={showError} />
      );
    case 'Text Box':
      return (
        <TextInputQuestion fontStyle={fontStyle} index={index} que={que} handleAnswer={handleAnswer} showError={showError} />
      );
    case 'DateTime':
      return (
        <DateTimeQuestion fontStyle={fontStyle} handleAnswer={handleAnswer} index={index} que={que} showError={showError} />
      );
    case 'Date':
      return (
        <DateQuestion fontStyle={fontStyle} handleAnswer={handleAnswer} index={index} que={que} showError={showError} />
      );
    case 'Multiple Choice':
      return (
        <MultipleChoiceQuestion
          fontStyle={fontStyle}
          index={index}
          handleAnswer={handleAnswer}
          que={que}
          showError={showError}
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
        />
      );
    case 'Time':
      return (
        <TimeQuestion fontStyle={fontStyle} index={index} handleAnswer={handleAnswer} que={que} showError={showError} />
      );
    case 'Descriptive':
      return <legend>{que?.question}</legend>;
    case 'Dropdown':
      return (
        <DropDownQuestion fontStyle={fontStyle} handleAnswer={handleAnswer} index={index} que={que} showError={showError} />
      );
    default:
      return null;
  }
};

const QuestionsComponent = React.memo(({ questions, handleAnswer, fontStyle, showError }) => {
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
      <div className={`${styles.question} d-flex ${que?.isDescriptiveChild ? 'ps-5' : ''}`}>
        <div sm={1} id={styles.listing} className="mx-4">
          {que?.isDescriptiveChild ? ALBHABETS[childQuestionletterIndex] : questionNumber}
        </div>
        <div sm={11} className={que?.isDescriptiveChild ? 'ps-5' : ''}>
          {getOptions(que.response_type, que, handleAnswer, index, fontStyle, showError)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`custom-scroll ${styles['question-section']}`}>
        {questions.map((que, index) => questionContent(que, index))}
      </div>
    </>
  );
});

QuestionsComponent.defaultProps = {
  questions: [],
};

export default QuestionsComponent;
