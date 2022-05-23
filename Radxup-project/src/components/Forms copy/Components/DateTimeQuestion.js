import React, { useEffect, useRef, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import styles from '../../../stylesheets/Forms.module.scss';
import _ from 'lodash';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';
import Datetime from 'react-datetime';
import moment from 'moment';

const DateTimeQuestion = React.memo(({ que, dateTime, handleChange }) => {
  const [state, setState] = useState(false);
  const handleCheckboxChange = (e) => {
    setState(e.target.checked);
    handleChange({ target: { value: '' } }, que);
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`datetimepicker${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  const isValidDate = (current) => {
    let min;
    let max;
    if (!!dateTime) {
      min = que.FSQAttributes[0]?.max_current_datetime
        ? moment().subtract(120, 'years')
        : moment(que.FSQAttributes[0]?.min_datetime);
      max = que.FSQAttributes[0]?.max_current_datetime ? moment() : moment(que.FSQAttributes[0]?.max_datetime);
    } else {
      min = que.FSQAttributes[0]?.max_current_datetime
        ? moment().subtract(120, 'years')
        : moment(que.FSQAttributes[0]?.min_date);
      max = que.FSQAttributes[0]?.max_current_datetime ? moment() : moment(que.FSQAttributes[0]?.max_date);
    }
    return current.isSameOrAfter(min) && current.isSameOrBefore(max);
  };

  return (
    <>
      <legend>{que?.question}</legend>
      <FormGroup className="d-flex align-items-center flex-wrap pt-2">
        <InputGroup className={styles['input-group']}>
          <div className={`${styles.dateTimeIcon}`} id={`datetimepicker${que.variable_name}${dateTime}`}>
            {!!dateTime && (
              <Datetime
                initialValue={que?.FSQAttributes[0]?.min_datetime ? moment(que.FSQAttributes[0]?.min_datetime) : ''}
                timeFormat={false}
                dateFormat="MM/DD/YYYY;"
                onChange={(event) => {
                  handleChange({ target: { value: moment(event._d).format('MM/DD/YYYY HH:mm') } }, que);
                }}
                timeFormat="HH:mm"
                className={`${styles.defaultDateTimeText}`}
                isValidDate={isValidDate}
                inputProps={{
                  disabled: state,
                  value: state || !que?.answer ? '' : moment(que?.answer).format('MM/DD/YYYY HH:mm'),
                  onChange: (e) => {
                    return false;
                  },
                }}
              />
            )}
            {!dateTime && (
              <Datetime
                dateFormat="MM/DD/YYYY"
                className={`${styles.defaultDateTimeText}`}
                isValidDate={isValidDate}
                onChange={(event) => {
                  handleChange({ target: { value: moment(event._d).format('MM/DD/YYYY') } }, que);
                }}
                initialValue={que?.FSQAttributes[0].min_date ? moment(que?.FSQAttributes[0]?.min_date) : ''}
                timeFormat={false}
                inputProps={{
                  disabled: state,
                  value: state || !que?.answer ? '' : moment(que?.answer).format('MM/DD/YYYY'),
                  onChange: (e) => {
                    return false;
                  },
                }}
              />
            )}
            <img
              src={'/images/calendar-icon.svg'}
              onClick={() => openDatepicker(`${que.variable_name}${dateTime}`)}
              className={`${styles.dateTimeIconImage}`}
            ></img>
          </div>
        </InputGroup>
        <FormCheck
          type="checkbox"
          className="mt-2"
          label={PREFER_NOT_ANSWER_TEXT[que.language] || 'Prefer not to answer'}
          disabled={!que?.FSQAttributes[0]?.not_to_ans}
          name={`group_${que.id}`}
          onChange={handleCheckboxChange}
          id={que?.question}
        />
      </FormGroup>
    </>
  );
});

export default DateTimeQuestion;

DateTimeQuestion.defaultProps = {
  que: {},
};
