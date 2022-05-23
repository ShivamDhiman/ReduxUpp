import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import _ from 'lodash';
import { isValidQuestion } from '../../../utils/commonFunctions';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const TextInputQuestion = React.memo(({ que, index, handleAnswer, fontStyle, showError, isICF }) => {
  const [attributeKey, setAttributeKey] = useState('FSQAttributes');

  useEffect(() => {
    setAttributeKey(isICF ? 'eICFFQAttributes' : 'FSQAttributes')
  }, [])

  return (
    <>
      <lable className={`${fontStyle?.questionStyle} ${styles.questionText}`}>{que.question}</lable>
      <FormGroup className="d-flex align-items-center flex-wrap pt-2">
        <InputGroup className={styles['input-group']}>
          <FormControl
            className={fontStyle?.inputStyle}
            name="textField"
            minLength={que?.[attributeKey]?.[0]?.text_min_char}
            maxLength={que?.[attributeKey]?.[0]?.text_max_char || 1024}
            disabled={que?.not_to_ans}
            value={que?.answer}
            onChange={(event) => handleAnswer(event.target.value, index)}
          />
        </InputGroup>
        {que?.[attributeKey]?.[0]?.not_to_ans && (
          <FormCheck
            type="checkbox"
            className={`${fontStyle?.questionStyle} mt-2`}
            label={PREFER_NOT_ANSWER_TEXT[que.language] || 'Prefer not to answer'}
            disabled={!que?.[attributeKey]?.[0]?.not_to_ans || isICF}
            name={`group_${que.id}`}
            checked={que.not_to_ans}
            onChange={(event) => {
              handleAnswer(event.target.checked, index, 'not_to_ans');
              handleAnswer('', index);
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

export default TextInputQuestion;

TextInputQuestion.defaultProps = {
  que: {},
};
