import moment from 'moment';
import { useEffect, useState } from 'react';
import { Form, FormControl, FormGroup, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import { encodeData } from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';
import Datetime from 'react-datetime';
import ReactSelects from '../common/ReactSelects';
import { components } from 'react-select';
import makeAnimated from 'react-select/animated';
import _ from 'lodash';
import Validation from '../../utils/validations';

const dummyQuestion = {
  response_type: 'Text Box',
  FSQAttributes: [
    {
      not_to_ans: true,
      choice_key: 1,
      choice_label: '',
      choice_value: '',
      max_date: '',
      max_datetime: '',
      max_time: '',
      min_date: '',
      min_datetime: '',
      min_time: '',
      num_flot_max: '',
      num_max_value: '',
      num_min_value: '',
      response_type: '',
      text_max_char: '',
      text_min_char: '',
    },
  ],
};

const initialDependencyClause = {
  order: 1,
  condition: 'AND',
  dependent_form_code: '',
  variable_name: '',
  operator: '',
  values: '',
  loading: false,
  question: { ...dummyQuestion },
  questions: [],
};

let operatorOptions = {
  'Radio Button': [
    {
      label: '=',
      value: '=',
    },
    {
      label: '<>',
      value: '<>',
    },
    {
      label: 'Not In',
      value: 'Not In',
    },

    {
      label: 'In',
      value: 'In',
    },
  ],
  'Multiple Choice': [
    {
      label: '=',
      value: '=',
    },
    {
      label: '<>',
      value: '<>',
    },
    {
      label: 'Not In',
      value: 'Not In',
    },

    {
      label: 'In',
      value: 'In',
    },
  ],
  // 'Text Box': [
  //   {
  //     label: '=',
  //     value: '=',
  //   },
  //   {
  //     label: '<>',
  //     value: '<>',
  //   },
  //   {
  //     label: 'Not In',
  //     value: 'Not In',
  //   },

  //   {
  //     label: 'In',
  //     value: 'In',
  //   },
  // ],
  Number: [
    {
      label: '=',
      value: '=',
    },
    {
      label: '<>',
      value: '<>',
    },
    {
      label: '<=',
      value: '<=',
    },
    {
      label: '>=',
      value: '>=',
    },
    {
      label: 'In',
      value: 'In',
    },
    {
      label: 'Not In',
      value: 'Not In',
    },
  ],
  DateTime: [
    {
      label: '=',
      value: '=',
    },
    {
      label: '<>',
      value: '<>',
    },
    {
      label: '<=',
      value: '<=',
    },
    {
      label: '>=',
      value: '>=',
    },
    {
      label: 'Add Hours',
      value: 'Add Hours',
    },
  ],
  // Time: [],
  Date: [
    {
      label: '=',
      value: '=',
    },
    {
      label: '<>',
      value: '<>',
    },
    {
      label: '<=',
      value: '<=',
    },
    {
      label: '>=',
      value: '>=',
    },
  ],
  // Dropdown: [
  //   {
  //     label: '=',
  //     value: '=',
  //   },
  //   {
  //     label: '<>',
  //     value: '<>',
  //   },
  //   {
  //     label: 'Not In',
  //     value: 'Not In',
  //   },

  //   {
  //     label: 'In',
  //     value: 'In',
  //   },
  // ],
};

const DependencyClauseCard = (props) => {
  const { styles, setDependencyData, formType, showErrors, formDependencyMapping } = props;
  const [dependencyForms, setDependencyForms] = useState([]);
  const [dependencyClause, setDependencyClause] = useState([]);
  const [dependencyExpand, setDependencyExpand] = useState(false);

  const isFormDataLoading = () => {
    let data = [...dependencyClause];
    return data.some((clause) => clause.loading);
  };

  const addDependencyClause = () => {
    if (isFormDataLoading()) {
      return;
    }
    let data = [...dependencyClause];
    data.push({
      condition: 'AND',
      dependent_form_code: '',
      variable_name: '',
      operator: '',
      values: '',
      loading: false,
      question: { ...dummyQuestion },
    });
    setDependencyClause([...data]);
  };

  const removeDependencyClause = (index) => {
    dependencyClause.splice(index, 1);

    setDependencyClause([...dependencyClause]);
  };

  useEffect(() => {
    if (dependencyForms?.length && formDependencyMapping?.length) {
      let dpendecyArray = [];
      formDependencyMapping.forEach((dependency, index) => {
        let { condition, dependent_form_code, operator, question, values, variable_name, response_type, label, order } =
          dependency;
        const foundForm = dependencyForms?.find((form) => form?.form_code === dependent_form_code);
        const foundQuestion = foundForm?.FSQuestions.find((que) => que?.variable_name === variable_name);
        let formattedData = {
          order,
          condition,
          dependent_form_code,
          response_type: response_type,
          variable_name,
          operator,
          values,
          label: label,
          questions: foundForm?.FSQuestions,
          question: foundQuestion,
        };
        if (foundQuestion?.response_type === 'Multiple Choice') {
          let values = formattedData?.values?.split(',');
          let labels = formattedData?.label?.split(',');
          let selectedChilces = [];
          if (labels?.length && values?.length) {
            values?.map((value, index) => {
              selectedChilces.push({
                label: labels[index],
                labelText: labels[index],
                value: value,
              });
            });
          }
          formattedData.values = selectedChilces;
        }
        dpendecyArray.push(formattedData);
      });
      setDependencyClause(dpendecyArray);
      setDependencyData(dependencyClause);
    }
  }, [formDependencyMapping, dependencyForms]);

  useEffect(() => {
    setDependencyData(dependencyClause);
  }, [dependencyClause]);

  useEffect(() => {
    if (formType?.formType) {
      getDependencyForms();
    }
  }, [formType]);

  const handleDependencyClauseChange = (e, index) => {
    let { name, value, type } = e.target;
    if (!value) {
      dependencyClause[index][name] = value;
      setDependencyClause([...dependencyClause]);
      return;
    }
    switch (name) {
      case 'condition':
        break;
      case 'dependent_form_code':
        let selectedForm = dependencyForms.find((form) => form.form_code == value);
        dependencyClause[index] = {
          ...dependencyClause[index],
          loading: true,
          variable_name: '',

          // operator: '',
          values: '',
          question: { ...dummyQuestion },
        };
        getFormData(selectedForm, index);
        break;
      case 'variable_name':
        let found = dependencyClause[index].questions.find((que) => que.variable_name === value);
        dependencyClause[index] = {
          ...dependencyClause[index],
          // operator: '',
          values: '',
        };

        dependencyClause[index].question = found;
        dependencyClause[index].operator = operatorOptions[found.response_type][0]?.value;
        dependencyClause[index].variable_name = found.variable_name;

        break;
      case 'operator':
        dependencyClause[index].values = '';
        break;
      case 'values':
        if (dependencyClause[index]?.question?.response_type == 'Date') {
          value = moment(value).format('MM/DD/YYYY');
        }
        if (dependencyClause[index]?.question?.response_type == 'DateTime') {
          if (!dependencyClause[index].operator === 'Add Hours') {
            value = moment(value).format('MM/DD/YYYY hh:mm');
          }
        }
        // if (dependencyClause[index]?.question?.response_type == 'Time') {
        //   value = moment(value).format('hh:mm');
        // }
        if (dependencyClause[index]?.question?.response_type == 'Radio Button') {
          let attribute = dependencyClause[index].question.FSQAttributes.find((attr) => attr.choice_value == value);
          dependencyClause[index].label = attribute?.choice_label;
        }
        if (dependencyClause[index]?.question?.response_type == 'Multiple Choice') {
          let labels = value.map((ele) => ele.labelText);
          dependencyClause[index].label = labels.join();
        }
        // if (dependencyClause[index]?.question?.response_type == 'Dropdown') {
        //   let attribute = dependencyClause[index].question.FSQAttributes.find((attr) => attr.choice_value == value);
        //   dependencyClause[index].label = attribute?.choice_label;
        // }

        break;
    }
    dependencyClause[index][name] = value;
    setDependencyClause([...dependencyClause]);
  };

  const toggleDependencySection = () => {
    setDependencyExpand(!dependencyExpand);
  };

  const getFormData = (formInfo, index) => {
    let questions = [];
    formInfo?.FSQuestions?.forEach((question) => {
      if (question.response_type !== 'Descriptive') {
        questions?.push(question);
      }
    });
    dependencyClause[index].questions = [...questions];
    dependencyClause[index].loading = false;
    setDependencyClause([...dependencyClause]);
  };

  const setFormLoading = (index) => {
    dependencyClause[index].loading = false;
    setDependencyClause([...dependencyClause]);
  };

  const getChoicesForMultiSelect = (attributes) => {
    const choiceOptions = attributes.map((item, i) => ({
      label: item.choice_label,
      labelText: item.choice_label,
      value: item.choice_value,
    }));
    return choiceOptions;
  };

  const getDependencyForms = () => {
    const query = { category: formType.formType };
    API.apiGet('dependencyforms', `?query=${encodeData(query)}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          if (!response.data.data?.length) {
            // toast.info('No dependency data found');
            return;
          }
          setDependencyForms([...response.data.data]);
        }
      })
      .catch((error) => {
        handleErrorMessage(error);
      });
  };

  const formatEvent = (e) => {
    const data = {
      target: {
        name: 'values',
        value: e,
      },
    };
    return data;
  };

  const isDuplicateVariableName = (data) => {
    let found = dependencyClause.filter(
      (clause) =>
        clause?.variable_name &&
        clause?.variable_name == data?.variable_name &&
        clause?.dependent_form_code === data?.dependent_form_code
    );
    return found.length > 1 ? true : false;
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`datetimepicker${variable}`);
    datePickerDiv.querySelector('input').focus();
  };
  return (
    <>
      <div className={`${styles.sectionHeader} row`}>
        <div className="col-md-6 d-flex align-items-end p-0">
          <span className={`${styles.defaultBoldText}`}>Dependency</span>
        </div>
        <div className={`col ${styles.sectionToggle}`}>
          <img
            src={dependencyExpand ? '/images/right-arrow.svg' : '/images/bottom-arrow.svg'}
            data-toggle="tooltip"
            title="Expand"
            className="cursor-pointer mx-2"
            onClick={() => toggleDependencySection()}
          />
        </div>
      </div>

      <div className={`${dependencyExpand ? 'mt-4' : 'd-none'}`}>
        <div className={`d-flex `}>
          <div className={`   ${styles.formDependencyOperatorLabel}`}>And Or</div>
          <div className={` ms-2 ${styles.formDependencyDropdownLabel}`}>Form Name</div>
          <div className={`  ${styles.formDependencyDropdownLabel}`}>Variable</div>
          <div className={`  ${styles.formDependencyDropdownLabel}`}>Operator</div>
          <div className={`   ${styles.formDependencyDropdownLabel}`}>Value</div>
          <div className="">&nbsp;</div>
        </div>
        {dependencyClause.map((clause, cIndex) => (
          <div className="d-flex pt-2 mb-3">
            <div className={`${styles.formDependencyOperator}`}>
              <Form.Group controlId="selectQuestion">
                <Form.Select
                  hidden={cIndex === 0}
                  type="text"
                  name={`condition`}
                  // onChange={handleChange}
                  value={clause?.condition}
                  // className={`${styles.formDependencyOperator}`}
                  onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                  aria-label="Default select combine operator"
                  // isInvalid={showErrors && Validation.empty(clause?.condition)}
                  required
                >
                  <option value="AND">And </option>
                  <option value="OR">Or </option>
                </Form.Select>
                {/* <Form.Control.Feedback type="invalid">Combination operator is required field.</Form.Control.Feedback> */}
              </Form.Group>
            </div>
            <div className={`${styles.formDependencyDropdown}`}>
              <Form.Group className="col" controlId="selectQuestion">
                <Form.Select
                  type="text"
                  name={`dependent_form_code`}
                  onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                  value={clause?.dependent_form_code}
                  aria-label="Default select form name"
                  disabled={clause?.loading}
                  isInvalid={showErrors && Validation.empty(clause?.dependent_form_code)}
                  required
                >
                  <option value="">Select Form</option>
                  {dependencyForms?.map((form) => (
                    <option key={form.form_code} value={form.form_code}>
                      {form.name}{' '}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">Form Name is required field.</Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className={`${styles.formDependencyDropdown}`}>
              <Form.Group className="col" controlId="selectQuestion">
                <Form.Select
                  type="text"
                  name={`variable_name`}
                  // onChange={handleChange}
                  value={clause?.variable_name}
                  onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                  aria-label="Default select variable_name"
                  isInvalid={isDuplicateVariableName(clause) || (showErrors && Validation.empty(clause?.variable_name))}
                  required
                  disabled={clause?.loading}
                >
                  <option value="">Select Variable</option>
                  {clause?.questions?.map((question, qIndex) => (
                    <option key={qIndex} value={question?.variable_name}>
                      {question?.variable_name}
                    </option>
                  ))}
                </Form.Select>
                {isDuplicateVariableName(clause) && (
                  <Form.Control.Feedback type="invalid">Variable name is already used.</Form.Control.Feedback>
                )}
                {showErrors && Validation.empty(clause?.variable_name) && (
                  <Form.Control.Feedback type="invalid">Variable name is required field.</Form.Control.Feedback>
                )}
              </Form.Group>
            </div>
            <div className={`${styles.formDependencyDropdown}`}>
              <Form.Group className="col" controlId="selectQuestion">
                <Form.Select
                  type="text"
                  name={`operator`}
                  // onChange={handleChange}
                  onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                  value={clause?.operator}
                  aria-label="Default select operator"
                  isInvalid={showErrors && Validation.empty(clause?.operator)}
                  required
                >
                  {/* <option value="">Select Operator</option> */}
                  {operatorOptions[clause?.question?.response_type]?.map((operator, opIndex) => (
                    <option key={opIndex} value={operator?.value}>
                      {operator?.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">Operator is required field.</Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className={`${styles.formDependencyDropdown}`}>
              {'Radio Button' === clause?.question?.response_type && (
                <Form.Group className="col" controlId="selectQuestion">
                  <Form.Select
                    type="text"
                    name={`values`}
                    // onChange={handleChange}
                    onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                    value={clause?.values}
                    aria-label="Default select form name"
                    isInvalid={showErrors && Validation.empty(clause?.values)}
                    required
                  >
                    <option value="">Select Options</option>
                    {clause?.question?.FSQAttributes.map((attribute) => (
                      <option value={attribute?.choice_value}>{attribute?.choice_label} </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">Dependecy value is required field.</Form.Control.Feedback>
                </Form.Group>
              )}
              {/* {'Dropdown' === clause?.question?.response_type && (
                <Form.Group className="col" controlId="selectQuestion">
                  <Form.Select
                    type="text"
                    name={`values`}
                    // onChange={handleChange}
                    onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                    value={clause?.values}
                    aria-label="Default select form name"
                    isInvalid={showErrors && Validation.empty(clause?.values)}
                    required
                  >
                    <option value="">Select Options</option>
                    {clause?.question?.FSQAttributes.map((attribute) => (
                      <option value={attribute?.choice_value}>{attribute?.choice_label} </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">Dependecy value is required field.</Form.Control.Feedback>
                </Form.Group>
              )} */}
              {'Multiple Choice' === clause?.question?.response_type && (
                <>
                  <ReactSelects
                    name={`values`}
                    className={'react-select-multichoice'}
                    options={getChoicesForMultiSelect(clause?.question?.FSQAttributes)}
                    isMulti={true}
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    components={{ Option, MultiValue, animatedComponents }}
                    onChange={(e) => handleDependencyClauseChange(formatEvent(e), cIndex)}
                    allowSelectAll={false}
                    value={clause?.values}
                  />
                  {showErrors && Validation.empty(clause?.values) && (
                    <small className="text-danger">Dependecy value is required field.</small>
                  )}
                </>
              )}
              {/* {'Text Box' === clause?.question?.response_type && (
                <FormGroup className="d-flex align-items-center flex-wrap">
                  <FormControl
                    onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                    name={`values`}
                    minLength={clause?.question?.FSQAttributes[0]?.text_min_char}
                    maxLength={clause?.question?.FSQAttributes[0]?.text_max_char}
                    // disabled={state}
                    isInvalid={showErrors && Validation.empty(clause?.values)}
                  />
                </FormGroup>
              )} */}
              {'Number' === clause?.question?.response_type && (
                <FormGroup className="d-flex align-items-center flex-wrap ">
                  <FormControl
                    name={`values`}
                    onChange={(e) => handleDependencyClauseChange(e, cIndex)}
                    type="number"
                    value={clause?.values}
                    min={clause?.question?.FSQAttributes[0]?.num_min_value}
                    max={clause?.question?.FSQAttributes[0]?.num_max_value}
                    onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                    // onChange={(e) => handleChange(e, que)}
                    isInvalid={showErrors && Validation.empty(clause?.values)}
                  />
                  <Form.Control.Feedback type="invalid">Dependecy value is required field.</Form.Control.Feedback>
                </FormGroup>
              )}
              {'DateTime' === clause?.question?.response_type && clause?.operator !== 'Add Hours' && (
                <FormGroup className="d-flex align-items-center flex-wrap ">
                  {/* <InputGroup className={styles['input-group']}> */}
                  <div className={`${styles.dateTimeIcon}`} id={`datetimepicker${cIndex}`}>
                    <Datetime
                      initialValue={clause?.values ? moment(clause?.values) : ''}
                      timeFormat={false}
                      closeOnClickOutside={true}
                      name={`values`}
                      onChange={(e) => handleDependencyClauseChange(formatEvent(e), cIndex)}
                      inputProps={{
                        onChange: (e) => {
                          return false;
                        },
                      }}
                      dateFormat="MM/DD/YYYY;"
                      timeFormat="HH:mm"
                      className={`${styles.defaultDateTimeText}`}
                      // isValidDate={isValidDate}
                      // inputProps={{ disabled: state }}
                    />
                    {showErrors && Validation.empty(clause?.values) && (
                      <small className="text-danger">Dependecy value is required field.</small>
                    )}
                    <img
                      src={'/images/calendar-icon.svg'}
                      onClick={() => openDatepicker(`${cIndex}`)}
                      className={`${styles.dateTimeIconImage}`}
                    ></img>
                  </div>
                  {/* </InputGroup> */}
                </FormGroup>
              )}
              {'DateTime' === clause?.question?.response_type && clause?.operator === 'Add Hours' && (
                <div>
                  <FormGroup className="d-flex align-items-center flex-wrap">
                    <FormControl
                      onChange={(e) => e?.target?.value < 9999 && handleDependencyClauseChange(e, cIndex)}
                      name={`values`}
                      type="number"
                      value={clause?.values}
                      min="0"
                      max="9999"
                      onKeyDown={(e) => ['e', 'E'].includes(e.key) && e.preventDefault()}
                      isInvalid={showErrors && Validation.empty(clause?.variable_name)}

                      // disabled={state}
                    />
                    <Form.Control.Feedback type="invalid">Dependecy value is required field.</Form.Control.Feedback>
                  </FormGroup>
                </div>
              )}
              {'Date' === clause?.question?.response_type && (
                <FormGroup className="d-flex align-items-center flex-wrap ">
                  {/* <InputGroup className={styles['input-group']}> */}
                  <div className={`${styles.dateTimeIcon}`} id={`datetimepicker${cIndex}`}>
                    <Datetime
                      dateFormat="MM/DD/YYYY"
                      closeOnClickOutside={true}
                      name={`values`}
                      className={`${styles.defaultDateTimeText}`}
                      // isValidDate={isValidDate}
                      initialValue={clause?.values ? moment(clause?.values) : ''}
                      onChange={(e) => handleDependencyClauseChange(formatEvent(e), cIndex)}
                      timeFormat={false}
                      inputProps={{
                        onChange: (e) => {
                          return false;
                        },
                      }}
                      // isValidDate={isValidDate}
                      // inputProps={{ disabled: state }}
                    />
                    {showErrors && Validation.empty(clause?.values) && (
                      <small className="text-danger">Dependecy value is required field.</small>
                    )}
                    <img
                      src={'/images/calendar-icon.svg'}
                      onClick={() => openDatepicker(`${cIndex}`)}
                      className={`${styles.dateTimeIconImage}`}
                    ></img>
                  </div>
                  {/* </InputGroup> */}
                </FormGroup>
              )}

              {/* {'Time' === clause?.question?.response_type && (
                <div className={`${styles.dateTimeIcon}`}>
                  <Datetime
                    name={`values`}
                    // disabled={state}
                    // isTimeValid={isValidDate}
                    dateFormat={false}
                    timeFormat="HH:mm"
                    className={`${styles?.defaultDateTimeText}`}
                    inputProps={{ disabled: state }}
                    onChange={(e) => handleDependencyClauseChange(formatEvent(e), cIndex)}
                    initialValue={
                      clause?.question?.FSQAttributes[0]?.min_time
                        ? moment(clause?.question?.FSQAttributes[0]?.min_time, 'HH:mm:ss')
                        : ''
                    }
                  />
                  <img src={'/images/clock-icon.svg'} className={`${styles.dateTimeIconImage}`}></img>
                </div>
              )} */}
            </div>
            <div className="flex-item p-2">
              <img
                src={'/images/cross.svg'}
                data-toggle="tooltip"
                title="Delete"
                height={15}
                className="cursor-pointer mx-2"
                onClick={() => removeDependencyClause(cIndex)}
              />
            </div>
          </div>
        ))}
        <div className="d-flex flex-row ">
          <div className="cursor-pointer mt-2" onClick={addDependencyClause}>
            <img
              className={`${styles.addTextIcon} me-2`}
              src={'/images/plus-icon.svg'}
              data-toggle="tooltip"
              title="Add Clause"
            ></img>
            <span className={`${styles.defaultBoldText}`}>Add New Clause</span>
          </div>
        </div>
      </div>
    </>
  );
};
export default DependencyClauseCard;

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
