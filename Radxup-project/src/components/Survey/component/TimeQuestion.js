import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import _ from 'lodash';
import Datetime from 'react-datetime';
import moment from 'moment';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';
import { dateValidation, isValidDate, isValidQuestion } from '../../../utils/commonFunctions';

const TimeQuestion = React.memo(({ que, handleAnswer, index, fontStyle, showError, isICF }) => {
  const [state, setState] = useState(false);
  const [attributeKey, setAttributeKey] = useState('FSQAttributes');

  useEffect(() => {
    setAttributeKey(isICF ? 'eICFFQAttributes' : 'FSQAttributes')
  }, [])

  const handleChange = (e) => {
    setState(e.target.checked);
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`timepicker${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  return (
    <>
      <lable className={`${fontStyle?.questionStyle} ${styles.questionText}`}>{que.question}</lable>
      <FormGroup className="d-flex align-items-center flex-wrap pt-2">
        <InputGroup className={styles['input-group']}>
          <div className={`${styles.dateTimeIcon}`} id={`timepicker${que.variable_name}`}>
            <Datetime
              className={fontStyle?.inputStyle}
              inputProps={{
                disabled: que?.not_to_ans,
                value: que?.not_to_ans || !que?.answer ? '' : moment(que?.answer, 'HH:mm').format('HH:mm'),
                onChange: (e) => {
                  return false;
                },
              }}
              dateFormat={false}
              isValidDate={(currentDate) =>
                dateValidation(currentDate, moment(que?.[attributeKey]?.[0]?.min_time), moment(que?.[attributeKey]?.[0]?.max_time))
              }
              // value={que?.not_to_ans ? '' : moment(que?.answer, 'HH:mm:ss')}
              onChange={(event) => {
                handleAnswer(moment(event._d).format('HH:mm'), index);
              }}
              timeFormat="HH:mm"
              className={`${styles?.defaultDateTimeText}`}
            />
            <img
              src={'/images/clock-icon.svg'}
              onClick={() => openDatepicker(`${que.variable_name}`)}
              className={`${styles.dateTimeIconImage}`}
            ></img>
          </div>
        </InputGroup>

        {que?.[attributeKey]?.[0]?.not_to_ans && (
          <FormCheck
            type="checkbox"
            className={`${fontStyle?.questionStyle} mt-2`}
            label={PREFER_NOT_ANSWER_TEXT[que.language] || 'Prefer not to answer'}
            disabled={!que?.[attributeKey]?.[0]?.not_to_ans || isICF}
            name={`group_${que?.id}`}
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
          <label className={`${styles.errorLable}`}>Valid Field is required *</label>
        </div>
      )}
    </>
  );
});

export default TimeQuestion;

TimeQuestion.defaultProps = {
  que: {},
};
