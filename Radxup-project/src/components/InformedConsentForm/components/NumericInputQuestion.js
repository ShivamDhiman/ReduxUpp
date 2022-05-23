import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import styles from '../../../stylesheets/ICForm.module.scss';

import _ from 'lodash';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const NumericInputQuestion = React.memo(({ que, handleChange }) => {
  const [state, setState] = useState(false);

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    if (checked) {
      const event = { target: { value: '' } };
      handleChange(event, que);
    }
    setState(checked);
  };
  return (
    <>
      <legend>{que?.question}</legend>
      <FormGroup className="d-flex align-items-center flex-wrap pt-2">
        <InputGroup className={styles['input-group']}>
          <FormControl
            name="numericField"
            type="number"
            value={que?.answer}
            min={que?.FSQAttributes[0]?.num_min_value}
            max={que?.FSQAttributes[0]?.num_max_value || 999999}
            onKeyDown={(e) => (e.key == 'e' || e.key == 'E') && e.preventDefault()}
            disabled={state}
            onChange={(e) => e?.target?.value <= (que?.FSQAttributes[0]?.num_max_value || 999999) && handleChange(e, que)}
          />
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

export default NumericInputQuestion;

NumericInputQuestion.defaultProps = {
  que: {},
};
