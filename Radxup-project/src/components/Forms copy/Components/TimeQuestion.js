import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import _ from 'lodash';
import Datetime from 'react-datetime';
import moment from 'moment';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';
import styles from '../../../stylesheets/Forms.module.scss';

const TimeQuestion = React.memo(({ que, handleChange }) => {
  const [state, setState] = useState(false);
  const [isError, setError] = useState(false);

  const [time, setTime] = useState(null);

  const handleCheckboxChange = (e) => {
    setState(e.target.checked);
    handleChange({ target: { value: '' } }, que);
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`timepicker${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  const isValidDate = function (current) {
    let min;
    let max;
    min = que.FSQAttributes[0]?.min_time ? moment(que.FSQAttributes[0]?.min_time) : moment();

    max = que.FSQAttributes[0]?.max_time ? moment(que.FSQAttributes[0]?.max_time) : moment();

    return current.isAfter(min) && current.isBefore(max);
  };

  const handleTimeChange = (info) => {
    let hour = moment(info._d).format('HH:mm');
    let currentTime = moment(hour, 'HH:mm');

    let maxTime = que.FSQAttributes[0]?.max_time ? moment(que?.FSQAttributes[0]?.max_time, 'HH:mm:ss') : moment();

    let minTime = que?.FSQAttributes[0]?.min_time
      ? moment(que?.FSQAttributes[0]?.min_time, 'HH:mm:ss')
      : moment().subtract(23, 'hour');

    if (currentTime.isBefore(minTime) || maxTime.isBefore(currentTime)) {
      setError(true);
    } else {
      setError(false);
    }
    handleChange({ target: { value: currentTime._i } }, que);
  };

  return (
    <>
      <legend>{que?.question}</legend>
      <FormGroup className="d-flex align-items-center flex-wrap pt-2">
        <InputGroup className={styles['input-group']}>
          <div className={`${styles.dateTimeIcon}`} id={`timepicker${que.variable_name}`}>
            <Datetime
              disabled={state}
              isTimeValid={isValidDate}
              dateFormat={false}
              timeFormat="HH:mm"
              className={`${styles?.defaultDateTimeText}`}
              inputProps={{
                disabled: state,
                value: state || !que?.answer ? '' : moment(que?.answer, 'HH:mm').format('HH:mm'),
                onChange: (e) => {
                  return false;
                },
              }}
              onChange={handleTimeChange}
              // initialValue={que?.FSQAttributes[0]?.min_time ? moment(que?.FSQAttributes[0]?.min_time, 'HH:mm:ss') : ''}
            />
            <img
              src={'/images/clock-icon.svg'}
              onClick={() => openDatepicker(`${que.variable_name}`)}
              className={`${styles.dateTimeIconImage}`}
            ></img>
          </div>
          {isError && !state && <span className="text-danger mt-1">Invalid Time</span>}
        </InputGroup>
        <FormCheck
          type="checkbox"
          className="mt-2"
          label={PREFER_NOT_ANSWER_TEXT[que.language] || 'Prefer not to answer'}
          disabled={!que?.FSQAttributes[0]?.not_to_ans}
          name={`group_${que?.id}`}
          onChange={handleCheckboxChange}
          id={que?.question}
        />
      </FormGroup>
    </>
  );
});

export default TimeQuestion;

TimeQuestion.defaultProps = {
  que: {},
};
