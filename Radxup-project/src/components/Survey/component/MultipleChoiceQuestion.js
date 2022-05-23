import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck } from 'react-bootstrap';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import { isValidQuestion } from '../../../utils/commonFunctions';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const MultipleChoiceQuestion = React.memo(({ que, index, handleAnswer, fontStyle, showError, isICF }) => {
  const [attributeKey, setAttributeKey] = useState('FSQAttributes');

  useEffect(() => {
    setAttributeKey(isICF ? 'eICFFQAttributes' : 'FSQAttributes')
  }, [])

  const handleChange = (event, choice_key) => {
    let answerArrey = que.answer ? que?.answer?.split(',') : [];
    let itemIndex = answerArrey.findIndex((e) => e === event.target.value);
    if (itemIndex !== -1) {
      answerArrey.splice(itemIndex, 1);
    } else {
      answerArrey.push(event.target.value);
    }
    let choiceKeyArrey = que.choice_key ? que?.choice_key?.split(',').sort() : [];
    let choiceKeyIndex = choiceKeyArrey.findIndex((e) => e === choice_key);
    if (choiceKeyIndex !== -1 && choiceKeyArrey.length !== 0) {
      choiceKeyArrey.splice(choiceKeyIndex, 1);
    } else {
      choiceKeyArrey.push(choice_key);
    }
    // handleAnswer(answerArrey.join(), index);
    if (choiceKeyArrey.join() !== '') {
      handleAnswer(answerArrey.join(), index, 'answer', null, choiceKeyArrey.join());
    } else {
      handleAnswer(answerArrey.join(), index, 'answer', null, 'null');
    }
  };

  return (
    <>
      <lable className={`${fontStyle?.questionStyle} ${styles.questionText}`}>{que.question}</lable>
      <FormGroup className="d-flex flex-wrap pt-2">
        {que?.[attributeKey]?.map((option, i) => (
          <FormCheck
            key={i}
            type="checkbox"
            label={option?.choice_label}
            name={`group_${que?.id}`}
            checked={que?.answer ? que?.answer?.split(',').findIndex((e) => e === option?.choice_label) !== -1 : false}
            value={option?.choice_label}
            className={`${fontStyle?.questionStyle}`}
            disabled={que?.not_to_ans}
            onChange={() => handleChange(event, option.choice_value)}
            id={`radio_${que?.question}_${i}`}
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

export default MultipleChoiceQuestion;

MultipleChoiceQuestion.defaultProps = {
  que: {},
  answer: {},
};
