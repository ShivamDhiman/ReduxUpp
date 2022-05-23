import React, { useState } from 'react';
import { FormGroup, FormCheck, Form } from 'react-bootstrap';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const DropDownQuestion = (props) => {
  const { styles, que, handleChange, index } = props;

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
      <div className="d-flex align-items-center">
        <FormGroup className="col-2 flex-wrap pt-2">
          <Form.Select
            type="text"
            name={`DropDown`}
            disabled={state}
            value={que.answer}
            onChange={(e) => handleChange(e, que)}
            required
          >
            <option value="">Select Options</option>
            {que?.FSQAttributes?.map((option, i) => (
              <option key={i} value={option?.choice_value} id={`${que?.question}_${i}`}>
                {option?.choice_label}
              </option>
            ))}
          </Form.Select>
          {/* <Form.Control.Feedback type="invalid">Field is required field.</Form.Control.Feedback> */}
        </FormGroup>
        <FormGroup className="col-3 flex-wrap ms-3 pt-2 mt-1">
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
      </div>
    </>
  );
};

export default DropDownQuestion;

DropDownQuestion.defaultProps = {
  que: {},
};
