import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, InputGroup, FormControl, Col } from 'react-bootstrap';
import styles from '../../../stylesheets/ICForm.module.scss';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';
import _ from 'lodash';

const TextInputQuestion = React.memo(({ que, handleChange }) => {
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
            name="textField"
            minLength={que?.FSQAttributes[0]?.text_min_char}
            maxLength={que?.FSQAttributes[0]?.text_max_char || 1024}
            value={que.answer}
            onChange={(event) => handleChange(event, que)}
            disabled={state}
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

export default TextInputQuestion;

TextInputQuestion.defaultProps = {
  que: {},
};
