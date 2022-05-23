import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import _ from 'lodash';
import Datetime from 'react-datetime';
import moment from 'moment';
import { dateValidation, isValidQuestion } from '../../../utils/commonFunctions';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const DateTimeQuestion = React.memo(({ que, dateTime, handleAnswer, index, fontStyle, showError, isICF }) => {
  const [state, setState] = useState(false);
  const [attributeKey, setAttributeKey] = useState('FSQAttributes');

  useEffect(() => {
    setAttributeKey(isICF ? 'eICFFQAttributes' : 'FSQAttributes');
  }, []);

  const getFormatedDateTime = (dateTime) => {
    return dateTime ? moment(dateTime).format('MM/DD/YYYY HH:mm') : moment().format('MM/DD/YYYY HH:mm');
  };

  const isValidDate = (current) => {
    let min;
    let max;
    min = que[attributeKey]?.[0]?.min_datetime
      ? moment(que[attributeKey]?.[0]?.min_datetime).subtract('hours', 1).format('MM/DD/YYYY HH:mm')
      : moment().subtract(120, 'years');
    max = que[attributeKey]?.[0]?.max_datetime
      ? moment(que[attributeKey]?.[0]?.max_datetime).format('MM/DD/YYYY HH:mm')
      : moment();
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
              className={fontStyle?.inputStyle}
              isValidDate={isValidDate}
              // value={que?.answer ? moment(que?.answer) : ''}
              onChange={(event) => {
                handleAnswer(moment(event._d).format('MM/DD/YYYY HH:mm'), index);
              }}
              dateFormat="MM/DD/YYYY"
              timeFormat="HH:mm"
              // className={`${styles.defaultDateTimeText}`}
              inputProps={{
                disabled: que?.not_to_ans,
                value: que?.not_to_ans || !que?.answer ? '' : moment(que?.answer).format('MM/DD/YYYY HH:mm'),
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
          <label className={`${styles.errorLable}`}>Valid Field is required *</label>
        </div>
      )}
    </>
  );
});

export default DateTimeQuestion;

DateTimeQuestion.defaultProps = {
  que: {},
};
