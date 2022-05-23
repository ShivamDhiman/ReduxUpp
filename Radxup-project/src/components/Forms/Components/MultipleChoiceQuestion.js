import React, { useState } from 'react';
import { FormGroup, FormCheck } from 'react-bootstrap';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const MultipleChoiceQuestion = React.memo(({ que, handleChange, index }) => {
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
        {que?.FSQAttributes?.map((option, i) => (
          <>
            <FormCheck
              key={i}
              type="checkbox"
              label={option?.choice_label}
              name={`group_${que?.question}-${index}`}
              value={option?.choice_value}
              checked={que?.selectedOptions.includes(option?.choice_value)}
              onClick={(e) => handleChange(e, que)}
              id={`radio_${que?.question}_${i}`}
              disabled={state}
            />
          </>
        ))}
        <FormCheck
          type="checkbox"
          className=" ms-4"
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

export default MultipleChoiceQuestion;

MultipleChoiceQuestion.defaultProps = {
  que: {},
  answer: {},
};
