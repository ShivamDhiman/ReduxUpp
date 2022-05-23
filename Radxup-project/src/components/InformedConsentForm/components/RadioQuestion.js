import React, { useState } from 'react';
import { FormGroup, FormCheck } from 'react-bootstrap';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';
import styles from '../../../stylesheets/ICForm.module.scss';

const RadioQuestion = React.memo(({ que, handleChange, index }) => {
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
      <legend>{que.question}</legend>
      <FormGroup className="d-flex flex-wrap align-items-center pt-2">
        {que?.FSQAttributes?.map((option, i) => (
          <FormCheck
            key={i}
            type="radio"
            label={option?.choice_label}
            name={`group_${que?.question}-${index}`}
            disabled={state}
            onClick={(e) => handleChange(e, que)}
            checked={option?.choice_value === que.answer}
            value={option?.choice_value}
            id={`radio_${que?.question}_${i}`}
          />
        ))}
        <FormCheck
          type="checkbox"
          className="ms-4"
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

export default RadioQuestion;

RadioQuestion.defaultProps = {
  que: {},
};
