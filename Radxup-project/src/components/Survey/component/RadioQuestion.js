import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck } from 'react-bootstrap';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import { isValidQuestion } from '../../../utils/commonFunctions';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const RadioQuestion = React.memo(({ que, handleAnswer, index, fontStyle, showError, isICF }) => {
  const [attributeKey, setAttributeKey] = useState('FSQAttributes');

  useEffect(() => {
    setAttributeKey(isICF ? 'eICFFQAttributes' : 'FSQAttributes')
  }, [])
  return (
    <>
      <label className={`${fontStyle?.questionStyle} ${styles.questionText}`}>{que.question}</label>
      <FormGroup key={index} className="d-flex flex-wrap pt-2">
        {que?.[attributeKey]?.map((option, i) => (
          <FormCheck
            key={option?.id}
            type="radio"
            label={option?.choice_label}
            name={`group_${option?.id}`}
            value={option.choice_label}
            className={`${fontStyle?.questionStyle}`}
            checked={option.choice_label === que?.answer}
            disabled={que?.not_to_ans}
            onChange={(event) => {
              handleAnswer(event.target.value, index, 'answer', null, option.choice_value);
            }}
            id={option?.id}
          />
        ))}
        {que?.[attributeKey]?.[0]?.not_to_ans && (
          <FormCheck
            type="checkbox"
            className={`${fontStyle?.questionStyle} `}
            label={PREFER_NOT_ANSWER_TEXT[que.language] || 'Prefer not to answer'}
            disabled={!que?.[attributeKey]?.[0]?.not_to_ans || isICF}
            name={`group_${que.id}`}
            checked={que.not_to_ans}
            onChange={(event) => {
              handleAnswer(event.target.checked, index, 'not_to_ans');
              handleAnswer(event.target.checked && que?.not_to_ans_value ? que?.not_to_ans_value : '', index);
            }}
            id={que?.question}
          />
        )}
      </FormGroup>
      {showError && !isValidQuestion(que) && (
        <div className={'col-md-12 d-flex align-items-start my-1'}>
          <label className={`${styles.errorLable}`}>Field is required *</label>
        </div>
      )}
    </>
  );
});

export default RadioQuestion;

RadioQuestion.defaultProps = {
  que: {},
  answer: {},
};
