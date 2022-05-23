import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import _ from 'lodash';
import { isValidQuestion } from '../../../utils/commonFunctions';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const NumericInputQuestion = React.memo(({ que, handleAnswer, index, fontStyle, showError, isICF }) => {
  const [state, setState] = useState(false);
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
            name="numericField"
            type="number"
            className={fontStyle?.inputStyle}
            min={que?.[attributeKey]?.[0]?.num_min_value || -999999}
            max={que?.[attributeKey]?.[0]?.num_max_value || 999999}
            disabled={que?.not_to_ans}
            value={que?.answer}
            onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
            onChange={(event) =>
              event?.target?.value <= (que?.[attributeKey]?.[0]?.num_max_value || 999999) &&
              handleAnswer(event.target.value, index)
            }
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
              handleAnswer(event.target.checked && que?.not_to_ans_value ? que?.not_to_ans_value : '', index);
            }}
            id={que?.question}
          />
        )}
      </FormGroup>
      {showError && !isValidQuestion(que) && (
        <div className={'col-md-12 d-flex align-items-start my-1'}>
          <label className={`${styles.errorLable}`}>Valid Field is required *</label>
        </div>
      )}
    </>
  );
});

export default NumericInputQuestion;

NumericInputQuestion.defaultProps = {
  que: {},
};
