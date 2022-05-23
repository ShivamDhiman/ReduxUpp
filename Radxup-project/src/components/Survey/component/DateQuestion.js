import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import _ from 'lodash';
import Datetime from 'react-datetime';
import moment from 'moment';
import { dateValidation, isValidQuestion } from '../../../utils/commonFunctions';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const DateQuestion = React.memo(({ que, dateTime, handleAnswer, index, fontStyle, showError, isICF }) => {
  const [attributeKey, setAttributeKey] = useState('FSQAttributes');
  
  useEffect(() => {
    setAttributeKey(isICF ? 'eICFFQAttributes' : 'FSQAttributes')
  }, [])

  const isValidDate = (current) => {
    let min;
    let max;
    min = que[attributeKey]?.[0]?.min_date ? moment(que[attributeKey]?.[0]?.min_date) : moment().subtract(120, 'years');
    max = que[attributeKey]?.[0]?.max_date ? moment(que[attributeKey]?.[0]?.max_date) : moment();
    return current.isSameOrAfter(min) && current.isSameOrBefore(max);
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`datetimepicker${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  return (
    <>
      <lable className={`${fontStyle?.questionStyle} ${styles.questionText}`}>{que.question}</lable>
      <FormGroup className="d-flex align-items-center flex-wrap pt-2">
        <InputGroup className={styles['input-group']}>
          <div className={`${styles.dateTimeIcon}`} id={`datetimepicker${que.variable_name}`}>
            <Datetime
              dateFormat="MM/DD/YYYY"
              className={fontStyle?.inputStyle}
              // className={`${styles.defaultDateTimeText}`}
              isValidDate={isValidDate}
              // value={que?.answer ? moment(que?.answer) : ''}
              onChange={(event) => {
                handleAnswer(moment(event._d).format('MM/DD/YYYY'), index);
              }}
              disabled={que?.not_to_ans}
              timeFormat={false}
              inputProps={{
                disabled: que?.not_to_ans,
                value: que?.not_to_ans || !que?.answer ? '' : moment(que?.answer).format('MM/DD/YYYY'),
                onChange: (e) => {
                  return false;
                },
              }}
            />

            <img
              src={'/images/calendar-icon.svg'}
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

export default DateQuestion;

DateQuestion.defaultProps = {
  que: {},
};
