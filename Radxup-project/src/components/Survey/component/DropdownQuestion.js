import React, { useEffect, useState } from 'react';
import { FormGroup, FormCheck, Form } from 'react-bootstrap';
import { isValidQuestion } from '../../../utils/commonFunctions';
import styles from '../../../stylesheets/SurveyForm.module.scss';
import { PREFER_NOT_ANSWER_TEXT } from '../../../constants/constant';

const DropDownQuestion = (props) => {
  const { que, handleAnswer, index, showError, fontStyle, isICF } = props;
  const [attributeKey, setAttributeKey] = useState('FSQAttributes');

  useEffect(() => {
    setAttributeKey(isICF ? 'eICFFQAttributes' : 'FSQAttributes')
  }, [])

  const handleChange = (e) => {
    const option = JSON.parse(e.target.value);
    handleAnswer(option.choice_value, index, 'answer', null, option.choice_key);
  };

  const getSelectedOption = (ans) => {
    let found = que[attributeKey]?.find((attr) => attr.choice_value == ans);
    return found ? JSON.stringify(found) : false;
  };

  return (
    <>
      <legend>{que?.question}</legend>
      <div className="d-flex align-items-center">
        <FormGroup className="col-2 flex-wrap pt-2">
          <Form.Select
            type="text"
            name={`DropDown`}
            value={getSelectedOption(que.answer)}
            onChange={handleChange}
            disabled={que?.not_to_ans}
            required
          >
            <option default selected hidden value="">
              Select Options
            </option>
            {que?.[attributeKey]?.map((option, i) => (
              <option key={i} value={JSON.stringify(option)} id={`${que?.question}_${i}`}>
                {option?.choice_label}
              </option>
            ))}
          </Form.Select>
        </FormGroup>
        {que?.[attributeKey]?.[0]?.not_to_ans && (
          <FormCheck
            type="checkbox"
            className={`${fontStyle?.questionStyle} ms-3 mt-2`}
            label={PREFER_NOT_ANSWER_TEXT[que.language] || 'Prefer not to answer'}
            disabled={!que?.[attributeKey]?.[0]?.not_to_ans || isICF}
            name={`group_${que.id}`}
            checked={que.not_to_ans}
            onChange={(event) => {
              handleAnswer(event.target.checked, index, 'not_to_ans');
              handleAnswer(event.target.checked && que?.not_to_ans_value ? que?.not_to_ans_value : '', index);
            }}
            id={que?.question}
          />
        )}
      </div>
      {showError && !isValidQuestion(que) && (
        <div className={'col-md-12 d-flex align-items-start my-1'}>
          <label className={`${styles.errorLable}`}>Field is required *</label>
        </div>
      )}
    </>
  );
};

export default DropDownQuestion;
