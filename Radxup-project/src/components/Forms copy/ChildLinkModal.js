import { useEffect, useState } from 'react';
import { Button, Modal, Form, FormGroup, InputGroup, FormControl, FormCheck, Spinner } from 'react-bootstrap';
import styles from '../../stylesheets/Forms.module.scss';
import ReactSelects from '../common/ReactSelects';
import { components } from 'react-select';
import makeAnimated from 'react-select/animated';
import Validation from '../../utils/validations';
import Datetime from 'react-datetime';
import moment from 'moment';

const Option = (props) => {
  return (
    <div className="reactSelect-option">
      <components.Option {...props}>
        <input className="form-check-input" type="checkbox" checked={props.isSelected} onChange={() => null} />{' '}
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

const MultiValue = (props) => (
  <components.MultiValue {...props}>
    <span>{props.data.label}</span>
  </components.MultiValue>
);

const animatedComponents = makeAnimated();
const numberOperators = [
  {
    label: '<=',
    value: '<=',
  },
  {
    label: '>=',
    value: '>=',
  },
  {
    label: '=',
    value: '=',
  },
  {
    label: 'Range',
    value: 'Range',
  },
];
const ChildLinkModal = ({ details, handleClose }) => {
  const { question, customQuestions, sectionIndex, qIndex, language } = details;
  const [choiceOptions, setChoiceOptions] = useState([]);
  const [choiceSelected, setChoiceSelected] = useState([]);
  const [variableOptions, setVariableOptions] = useState([]);
  const [variableSelected, setVariableSelected] = useState('');
  const [operatorSelected, setOperatorSelected] = useState('');
  const [numAttrib, setNumAttrib] = useState({ from: '', to: '' });
  const [datAttrib, setDateAttrib] = useState({ from: '', to: '' });

  const [showErrors, setShowErrors] = useState(false);

  const [isMulti, setIsMulti] = useState(false);
  const [isNumber, setIsNumber] = useState(false);
  const [isDate, setIsDate] = useState(false);

  const [isDescriptive, setIsDescriptive] = useState(false);

  const handleChangeVariable = (selected) => {
    setVariableSelected(selected);
    if (selected) {
      if (selected.isDescriptive) {
        setIsDescriptive(selected?.isDescriptive);
        setChoiceOptions([]);
      } else if (selected.isNumber) {
        setIsNumber(true);
      } else if (selected.isDate) {
        setIsDate(true);
      } else {
        const choiceOptions = selected.FSQAttributes.map((item, i) => ({
          label: item.choice_label || `Choice ${i + 1}`,
          labelText: item.choice_label,
          labelKey: item.choice_key,
          value: item.choice_value,
        }));
        setIsMulti(selected?.isMulti);
        setChoiceOptions(choiceOptions || []);
        setIsNumber(false);
      }
    }
  };

  useEffect(() => {
    if (isMulti) {
      setIsDescriptive(false);
      setIsNumber(false);
      setIsDate(false);
    }
    if (isNumber) {
      setIsDescriptive(false);
      setIsMulti(false);
      setIsDate(false);
    }
    if (isDescriptive) {
      setIsMulti(false);
      setIsNumber(false);
      setIsDate(false);
    }
    if (isDate) {
      setIsMulti(false);
      setIsNumber(false);
      setIsDescriptive(false);
    }
  }, [isMulti, isNumber, isDescriptive, isDate]);
  const handleChangeChoice = (selected) => {
    setChoiceSelected(selected);
  };

  const addChildBranching = () => {
    let sendData = '';
    if (variableSelected && isMulti && choiceSelected.length) {
      const attribListCondition = [...choiceSelected].map((item) => ({ [item.labelKey]: `==${item.value}` }));
      sendData = {
        linked_variable_name: [variableSelected.value],
        // question_attributes_list: [...choiceSelected].map((item) => item.value),
        // question_attributes_label: [[...choiceSelected].map((item) => item.labelText).join(',')],
        question_attributes_list: { [variableSelected.value]: attribListCondition },
        question_attributes_label: `${variableSelected.value} equals ${[...choiceSelected]
          .map((item) => item.labelText)
          .join(', ')}`,
        sectionIndex,
        qIndex,
        language,
      };
      handleClose(sendData);
    }
    if (variableSelected && !isMulti && choiceSelected.value) {
      //radio single
      sendData = {
        linked_variable_name: [variableSelected.value],
        // question_attributes_list:  [choiceSelected.value],
        // question_attributes_label: [choiceSelected.labelText],
        question_attributes_list: { [variableSelected.value]: [{ [choiceSelected.labelKey]: `==${choiceSelected.value}` }] },
        question_attributes_label: `${variableSelected.value} equals ${choiceSelected.labelText}`,
        sectionIndex,
        qIndex,
        language,
      };
      handleClose(sendData);
    }
    if (variableSelected && isDescriptive) {
      sendData = {
        linked_variable_name: [variableSelected.value],
        sectionIndex,
        qIndex,
        language,
      };
      handleClose(sendData);
    }

    if (variableSelected && isNumber) {
      setShowErrors(true);
      if (Validation.empty(numAttrib.from) ||  Validation.empty(operatorSelected.value)) {
        return;
      }
      if (operatorSelected.value === 'Range' && (Validation.empty(numAttrib.to) || Validation.empty(numAttrib.from))) {
        return;
      }
      if (getRangeError()) {
        return;
      }
      sendData = {
        linked_variable_name: [variableSelected.value],
        // question_attributes_list: [numAttrib.from],
        // question_attributes_label: [operatorSelected.value],
        question_attributes_list: {
          [variableSelected.value]: [{ [`number_${operatorSelected.value}`]: `${operatorSelected.value}${numAttrib.from}` }],
        },
        question_attributes_label: `${variableSelected.value} ${operatorSelected.value} ${numAttrib.from}`,
        sectionIndex,
        qIndex,
        language,
      };
      if (operatorSelected.value === 'Range') {
        // sendData.question_attributes_list.push(numAttrib.to);
        sendData.question_attributes_list = {
          [variableSelected.value]: [{ [`number_${operatorSelected.value}`]: `${numAttrib.from}-${numAttrib.to}` }],
        };
        sendData.question_attributes_label = `${variableSelected.value} of ${operatorSelected.value} ${numAttrib.from}-${numAttrib.to}`;
      }
      handleClose(sendData);
    }
    if (variableSelected && isDate) {
      setShowErrors(true);
      if (Validation.empty(datAttrib.from) || Validation.empty(operatorSelected.value)) {
        return;
      }
      if (operatorSelected.value === 'Range') {
        if (Validation.empty(datAttrib.to)) {
          return;
        }
        if (getDateRangeError(['Date', 'DateTime'].includes(variableSelected.response_type))) {
          return;
        }
      }
      sendData = {
        linked_variable_name: [variableSelected.value],
        question_attributes_list: {
          [variableSelected.value]: [
            {
              [`${variableSelected.response_type}_${operatorSelected.value}`]: `${operatorSelected.value}${datAttrib.from}`,
            },
          ],
        },
        question_attributes_label: `${variableSelected.value} ${operatorSelected.value} ${datAttrib.from}`,
        sectionIndex,
        qIndex,
        language,
      };
      if (operatorSelected.value === 'Range') {
        sendData.question_attributes_list = {
          [variableSelected.value]: [
            { [`${variableSelected.response_type}_${operatorSelected.value}`]: `${datAttrib.from}-${datAttrib.to}` },
          ],
        };
        sendData.question_attributes_label = `${variableSelected.value} of ${operatorSelected.value} ${datAttrib.from}-${datAttrib.to}`;
      }
      handleClose(sendData);
    }
  };

  useEffect(() => {
    if (customQuestions?.length) {
      const variableList = [];
      customQuestions.forEach((item) => {
        if (item[language].response_type && item[language].variable_name) {
          variableList.push({
            label: item[language].variable_name,
            value: item[language].variable_name,
            FSQAttributes: item[language].FSQAttributes,
            isMulti: item[language].response_type === 'Multiple Choice',
            isDescriptive: item[language].response_type === 'Descriptive',
            isNumber: item[language].response_type === 'Number',
            isDate: ['Date', 'DateTime', 'Time'].includes(item[language].response_type),
            response_type: item[language].response_type,
          });
        }
      });
      if (variableList.length) {
        const selected = variableList.find((item) => question?.linked_variable_name?.includes(item.value)); //single match level 0
        setVariableOptions(variableList);

        if (selected) {
          //extract variable based key value from question_attributes_list
          const questionAttribListValue =
            question.question_attributes_list && question.question_attributes_list[selected.value];

          const choiceOptions = selected.FSQAttributes.map((item, i) => ({
            label: item.choice_label || `Choice ${i + 1}`,
            labelText: item.choice_label,
            labelKey: item.choice_key,
            value: item.choice_value?.toString(),
          }));
          setIsMulti(selected?.isMulti);
          setIsNumber(selected?.isNumber);
          setIsDate(selected?.isDate);
          setIsDescriptive(selected?.isDescriptive);
          if (selected?.isNumber) {
            if (questionAttribListValue?.length) {
              const operatorLabels = Object.keys(questionAttribListValue[0]) || [];
              const operatorValues = Object.values(questionAttribListValue[0]) || [];
              const selectedLabel = operatorLabels[0]?.replace('number_', '');
              setOperatorSelected({
                label: selectedLabel,
                value: selectedLabel,
              });

              const from = parseInt(operatorValues[0]?.replace(selectedLabel, ''));
              if (selectedLabel === 'Range') {
                const fromValue = parseInt(operatorValues[0]?.split('-')[0]);
                const toValue = parseInt(operatorValues[0]?.split('-')[1]);
                setNumAttrib({ ...numAttrib, from: fromValue, to: toValue });
              } else {
                setNumAttrib({ ...numAttrib, from });
              }
            }

            /* old style */
            // setOperatorSelected({
            //   label: question?.question_attributes_label[0],
            //   value: question?.question_attributes_label[0],
            // });
            // const from = parseInt(question?.question_attributes_list[0]);
            // if (question?.question_attributes_label[0] === 'Range') {
            //   const to = parseInt(question?.question_attributes_list[1]);
            //   setNumAttrib({ ...numAttrib, from, to });
            // } else {
            //   setNumAttrib({ ...numAttrib, from });
            // }
          }
          if (selected?.isDate) {
            if (questionAttribListValue?.length) {
              const operatorLabels = Object.keys(questionAttribListValue[0]) || [];
              const operatorValues = Object.values(questionAttribListValue[0]) || [];
              const selectedLabel = operatorLabels[0]?.replace(`${selected.response_type}_`, '');
              setOperatorSelected({
                label: selectedLabel,
                value: selectedLabel,
              });

              const from = operatorValues[0]?.replace(selectedLabel, '');
              if (selectedLabel === 'Range') {
                const fromValue = operatorValues[0]?.split('-')[0];
                const toValue = operatorValues[0]?.split('-')[1];
                setDateAttrib({ ...datAttrib, from: fromValue, to: toValue });
              } else {
                setDateAttrib({ ...datAttrib, from });
              }
            }

            // if (questionAttribListValue?.length) {
            //   const operatorLabels = Object.keys(questionAttribListValue[0]) || [];
            //   const operatorValues = Object.values(questionAttribListValue[0]) || [];
            //   const from = operatorValues[0].split('-')[0];
            //   const to = operatorValues[0].split('-')[1];
            //   setDateAttrib({ ...datAttrib, from: from, to: to });
            // }
          }
          if (!selected.isDescriptive && !selected.isNumber && !selected.isDate) {
            setChoiceOptions(choiceOptions || []);
          }
          setVariableSelected(selected);

          if (choiceOptions?.length && questionAttribListValue?.length) {
            // matched choices values from object
            const listValues = questionAttribListValue.reduce((result, acc) => {
              return [...result, Object.values(acc)[0]?.replace('==', '')];
            }, []);

            const selectedOptions = choiceOptions.filter(
              // (item) => question?.question_attributes_list && question.question_attributes_list.includes(item.value)
              (item) => question?.question_attributes_list && listValues.includes(item.value)
            );
            setChoiceSelected(selectedOptions || []);
          }
        }
      }
    }
  }, [customQuestions, customQuestions?.length]);

  const handleChangeOperator = (operator) => {
    setOperatorSelected(operator);
  };

  const handleNumberAttributes = (e) => {
    setNumAttrib({ ...numAttrib, [e.target.name]: e.target.value });
  };
  const handleDateTime = (e) => {
    const { id, value } = e?.target;
    switch (id) {
      case 'DateFrom':
        let date = moment(value._d).format('MM/DD/YYYY');
        setDateAttrib({ ...datAttrib, from: date });
        break;
      case 'DateTimeFrom':
        let dateTime = moment(value._d).format('MM/DD/YYYY HH:mm');
        setDateAttrib({ ...datAttrib, from: dateTime });

        break;
      case 'TimeFrom':
        let time = moment(value._d).format('HH:mm');
        setDateAttrib({ ...datAttrib, from: time });

        break;
      case 'DateTo':
        let dateTo = moment(value._d).format('MM/DD/YYYY');
        setDateAttrib({ ...datAttrib, to: dateTo });
        break;
      case 'DateTimeTo':
        let dateTimeTo = moment(value._d).format('MM/DD/YYYY HH:mm');
        setDateAttrib({ ...datAttrib, to: dateTimeTo });

        break;
      case 'TimeTo':
        let timeTo = moment(value._d).format('HH:mm');
        setDateAttrib({ ...datAttrib, to: timeTo });

        break;
    }
  };

  const getRangeError = () => {
    return parseInt(numAttrib.from) >= parseInt(numAttrib.to);
  };
  const getDateRangeError = (isDate) => {
    let min;
    let max;
    if (isDate) {
      min = moment(datAttrib.from);
      max = moment(datAttrib.to);
      return !max.isSameOrAfter(min);
    } else {
      min = new Date();
      min.setHours(datAttrib.from.split(':')[0]);
      min.setMinutes(datAttrib.from.split(':')[1]);
      min = moment(min);
      max = new Date();
      max.setHours(datAttrib.to.split(':')[0]);
      max.setMinutes(datAttrib.to.split(':')[1]);
      max = moment(max);
      return datAttrib.from && datAttrib.to && !max.isSameOrAfter(min);
    }
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  return (
    <>
      <Modal.Header closeButton className="modal-header pb-0">
        <Modal.Title className="title fw-bold">View Link</Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4 ">
        <Form className={'row py-4'}>
          <div className="col-md-6">
            <Form.Group className="mb-3 d-flex flex-column" controlId="exampleForm.ControlInput1">
              <Form.Label>Select variable</Form.Label>
              {!customQuestions && (
                <FormControl
                  name="textField"
                  value={(question?.linked_variable_name?.length && question?.linked_variable_name.join(',  ')) || ''}
                  disabled={question?.linked_variable_name?.length && question?.linked_variable_name[0]}
                />
              )}
              {customQuestions && (
                <ReactSelects value={variableSelected} onChange={handleChangeVariable} options={variableOptions} />
              )}
            </Form.Group>
          </div>
          {!isDate && (
            <div className="col-md-6">
              <Form.Group className="mb-3 d-flex flex-column" controlId="exampleForm.ControlInput1">
                <Form.Label>Select {customQuestions && isNumber ? 'Operator': ''} Choice</Form.Label>
                {!customQuestions && (
                  <div className={`${styles.choiceLabel}`} name="textField">
                    {/* {question?.question_attributes_label?.join(';')} */}
                    {question?.question_attributes_label || ''}
                  </div>
                )}
                {customQuestions && !isNumber && !isDescriptive && (
                  <ReactSelects
                    options={choiceOptions}
                    isMulti={isMulti}
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    components={{ Option, MultiValue, animatedComponents }}
                    onChange={handleChangeChoice}
                    allowSelectAll={false}
                    value={choiceSelected}
                  />
                )}
                {customQuestions && isNumber && (
                  <>
                  <ReactSelects value={operatorSelected} onChange={handleChangeOperator} options={numberOperators} />
                  {showErrors && (
                    <small className="text-danger">{Validation.empty(operatorSelected.value) && `${customQuestions && isNumber ? 'Operator': ''} Choice is required`}</small>
                  )}
                  </>
                )}
              </Form.Group>
            </div>
          )}
          {customQuestions && isNumber && ['=', '<=', '>=', 'Range'].includes(operatorSelected.value) && (
            <div className="col-md-6">
              <Form.Group className="mb-3 d-flex flex-column" controlId="exampleForm.ControlInput1">
                <Form.Label>Set value</Form.Label>
                <FormControl
                  name="from"
                  type="number"
                  isInvalid={choiceSelected.isNumber && numAttrib.from}
                  isInvalid={showErrors && Validation.empty(numAttrib.from)}
                  onChange={handleNumberAttributes}
                  value={numAttrib.from}
                />
                <Form.Control.Feedback type="invalid">
                  {Validation.empty(numAttrib.from) && 'From value is required'}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          )}
          {customQuestions && isNumber && operatorSelected.value === 'Range' && (
            <div className={`col-md-6 ${styles.cst_position}`}>
              <span>to</span>
              <Form.Group className="mb-3 d-flex flex-column" controlId="exampleForm.ControlInput1">
                <Form.Label>&nbsp;</Form.Label>
                <FormControl
                  name="to"
                  type="number"
                  isInvalid={(showErrors && Validation.empty(numAttrib.to)) || getRangeError()}
                  onChange={handleNumberAttributes}
                  value={numAttrib.to}
                />
                <Form.Control.Feedback type="invalid">
                  {getRangeError() ? 'To must be greater than from value.' : 'To value is required'}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          )}

          {customQuestions && isDate && (
            <>
              <div className="col-md-6">
                <Form.Group className="mb-3 d-flex flex-column" controlId="exampleForm.ControlInput1">
                  <Form.Label>Select {customQuestions && isDate ? 'Operator': ''} Choice</Form.Label>
                  <ReactSelects value={operatorSelected} onChange={handleChangeOperator} options={numberOperators} />
                  {showErrors && (
                      <small className="text-danger">{Validation.empty(operatorSelected.value) && `${customQuestions && isDate ? 'Operator': ''} Choice is required`}</small>
                  )}
                </Form.Group>
              </div>
              {variableSelected.response_type === 'Date' && (
                <>
                  <div className={`col-md-6 `}>
                    <Form.Label>From</Form.Label>
                    <div className={`${styles.dateTimeIconChild}`} id="DateFrom">
                      <Datetime
                        dateFormat="MM/DD/YYYY"
                        timeFormat={false}
                        inputProps={{
                          onChange: (e) => {
                            return false;
                          },
                        }}
                        initialValue={datAttrib.from ? moment(datAttrib.from) : ''}
                        onChange={(ev) => handleDateTime({ target: { id: 'DateFrom', value: ev } })}
                      />
                      <img
                        src={'/images/calendar-icon.svg'}
                        onClick={() => openDatepicker(`DateFrom`)}
                        className={`${styles.dateTimeIconImageChild}`}
                      ></img>
                    </div>
                    {showErrors && (
                      <small className="text-danger">{Validation.empty(datAttrib.from) && 'From value is required'}</small>
                    )}
                  </div>
                  {operatorSelected.value === 'Range' && (
                    <div className={`col-md-6 `}>
                      <Form.Label>To</Form.Label>
                      <div className={`${styles.dateTimeIconChild}`} id="DateTo">
                        <Datetime
                          dateFormat="MM/DD/YYYY"
                          timeFormat={false}
                          inputProps={{
                            onChange: (e) => {
                              return false;
                            },
                          }}
                          initialValue={datAttrib.to ? moment(datAttrib.to) : ''}
                          onChange={(ev) => handleDateTime({ target: { id: 'DateTo', value: ev } })}
                        />
                        <img
                          src={'/images/calendar-icon.svg'}
                          onClick={() => openDatepicker(`DateTo`)}
                          className={`${styles.dateTimeIconImageChild}`}
                        ></img>
                      </div>
                      {showErrors && (
                        <>
                          <small className="text-danger">{Validation.empty(datAttrib.to) && 'To value is required'}</small>
                          <small className="text-danger">
                            {datAttrib.to && getDateRangeError(true) && 'To value must be greater than From'}
                          </small>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              {variableSelected.response_type === 'DateTime' && (
                <>
                  <div className={`col-md-6 `}>
                    <Form.Label>From</Form.Label>
                    <div className={`${styles.dateTimeIconChild}`} id="DateTimeFrom">
                      <Datetime
                        timeFormat={'HH:mm'}
                        dateFormat="MM/DD/YYYY"
                        inputProps={{
                          onChange: (e) => {
                            return false;
                          },
                        }}
                        initialValue={datAttrib.from ? moment(datAttrib.from) : ''}
                        onChange={(ev) => handleDateTime({ target: { id: 'DateTimeFrom', value: ev } })}
                      />
                      <img
                        src={'/images/calendar-icon.svg'}
                        onClick={() => openDatepicker(`DateTimeFrom`)}
                        className={`${styles.dateTimeIconImageChild}`}
                      ></img>
                    </div>
                    {showErrors && (
                      <small className="text-danger">{Validation.empty(datAttrib.from) && 'From value is required'}</small>
                    )}
                  </div>
                  {operatorSelected.value === 'Range' && (
                    <div className={`col-md-6 `}>
                      <Form.Label>To</Form.Label>
                      <div className={`${styles.dateTimeIconChild}`} id="DateTimeTo">
                        <Datetime
                          dateFormat="MM/DD/YYYY"
                          timeFormat={'HH:mm'}
                          inputProps={{
                            onChange: (e) => {
                              return false;
                            },
                          }}
                          initialValue={datAttrib.to ? moment(datAttrib.to) : ''}
                          onChange={(ev) => handleDateTime({ target: { id: 'DateTimeTo', value: ev } })}
                        />
                        <img
                          src={'/images/calendar-icon.svg'}
                          onClick={() => openDatepicker(`DateTimeTo`)}
                          className={`${styles.dateTimeIconImageChild}`}
                        ></img>
                      </div>
                      {showErrors && (
                        <>
                          <small className="text-danger">{Validation.empty(datAttrib.to) && 'To value is required'}</small>
                          <small className="text-danger">
                            {datAttrib.to && getDateRangeError(true) && 'To value must be greater than From'}
                          </small>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              {variableSelected.response_type === 'Time' && (
                <>
                  <div className={`col-md-6 `}>
                    <Form.Label>From</Form.Label>
                    <div className={`${styles.dateTimeIconChild}`} id="TimeFrom">
                      <Datetime
                        dateFormat={false}
                        timeFormat="HH:mm"
                        inputProps={{
                          onChange: (e) => {
                            return false;
                          },
                        }}
                        initialValue={datAttrib.from ? moment(datAttrib.from, 'HH:mm:ss') : ''}
                        onChange={(ev) => handleDateTime({ target: { id: 'TimeFrom', value: ev } })}
                      />
                      <img
                        src={'/images/calendar-icon.svg'}
                        onClick={() => openDatepicker(`TimeFrom`)}
                        className={`${styles.dateTimeIconImageChild}`}
                      ></img>
                    </div>
                    {showErrors && (
                      <small className="text-danger">{Validation.empty(datAttrib.from) && 'From value is required'}</small>
                    )}
                  </div>
                  {operatorSelected.value === 'Range' && (
                    <div className={`col-md-6 `}>
                      <Form.Label>To</Form.Label>
                      <div className={`${styles.dateTimeIconChild}`} id="TimeTo">
                        <Datetime
                          dateFormat={false}
                          timeFormat="HH:mm"
                          inputProps={{
                            onChange: (e) => {
                              return false;
                            },
                          }}
                          initialValue={datAttrib.to ? moment(datAttrib.to, 'HH:mm:ss') : ''}
                          onChange={(ev) => handleDateTime({ target: { id: 'TimeTo', value: ev } })}
                        />
                        <img
                          src={'/images/calendar-icon.svg'}
                          onClick={() => openDatepicker(`TimeTo`)}
                          className={`${styles.dateTimeIconImageChild}`}
                        ></img>
                      </div>
                      {showErrors && (
                        <>
                          <small className="text-danger">{Validation.empty(datAttrib.to) && 'To value is required'}</small>
                          <small className="text-danger">
                            {datAttrib.to && getDateRangeError(false) && 'To value must be greater than From'}
                          </small>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Form>
      </Modal.Body>
      {customQuestions && (
        <Modal.Footer className="modal-footer">
          <Button className="mx-3" variant="secondary" size="md" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={addChildBranching}>
            Add
          </Button>
        </Modal.Footer>
      )}
    </>
  );
};

export default ChildLinkModal;
