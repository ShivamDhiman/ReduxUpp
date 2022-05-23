import { useEffect, useState } from 'react';
import { Button, Modal, Form, FormGroup, InputGroup, FormControl, FormCheck, Spinner } from 'react-bootstrap';
import ReactSelects from '../common/ReactSelects';
import { components } from 'react-select';
import makeAnimated from 'react-select/animated';
import Validation from '../../utils/validations';
import Datetime from 'react-datetime';
import moment from 'moment';
import { toast } from 'react-toastify';

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
    label: '=',
    value: '=',
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
    label: 'Range',
    value: 'Range',
  },
];
const choicesOperators = [
  {
    label: '=',
    value: '==',
  },
];
/** Example linking */
// question":"Are you currently pregnant?","hint":"","variable*name":"pregnancy_status",
// "response_type":"Radio Button","descriptive":false,"not_to_ans_value":"99","child_node":false,"linked_level":1,
// "linked_variable_name":["bio_sex_birth_2","gender_identity_term","age_yrs"],
// "question_attributes_list":{
// "bio_sex_birth_2":[{"bio_sex_birth_2_rbn_1":"==1"}],
// "OP1":"AND",
// "gender_identity_term":[{"gender_identity_term_rbn_1":"==1"}],
// "OP2":"AND",
// "age_yrs":[{"number_>=":">=18"}]
// },
// "question_attributes_label":"Female and Woman and Age >= 18",

const ChildLinkModal = ({ details, handleClose, styles }) => {
  const { question, customQuestions = [], sectionIndex, qIndex, language, isSectionLinking } = details;

  // const isDisabledSection = isSectionLinking && question?.linked_variable_name?.length;
  const isDisabledSection = false;
  // TODO: new change multi case
  const [linkingClause, setLinkingClause] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const [descriptiveLinking, setDescriptiveLinking] = useState(false);
  const addLinkingClause = () => {
    let data = [...linkingClause];
    data.push({
      condition: 'AND',
      variable_name: '',
      question: '',
      operator: '=',
      values: '',
      valueFrom: '',
      valueTo: '',
    });
    setLinkingClause([...data]);
  };

  // console.log(customQuestions, 'customQuestions');
  // console.log(question, 'question');
  // console.log(linkingClause, 'linkingClause');

  const removeLinkingClause = (index) => {
    if (descriptiveLinking && index === 0) {
      //reset if descriptiveLinking
      setDescriptiveLinking(false);
    }
    linkingClause.splice(index, 1);

    setLinkingClause([...linkingClause]);
  };

  const [isDescriptive, setIsDescriptive] = useState(false);

  useEffect(() => {}, []);

  const handleChangeChoice = (selected) => {
    setChoiceSelected(selected);
  };

  const addChildBranching = () => {
    let sendData = '';
    let isNotValid = false;
    setShowErrors(true);
    if (linkingClause?.length && linkingClause.every((item) => item.variable_name)) {
      let question_attributes_list = {};
      let linked_variable_name = [];
      let question_attributes_label_list = [];
      linkingClause.forEach((linking, index) => {
        linked_variable_name.push(linking.variable_name);
        /** add condition */
        if (index > 0 || (index > 0 && index === linkingClause.length - 1)) {
          if (!linking.condition) {
            isNotValid = true; //in case of condition not selected  1 0 3 0 5 0 7
          }
          question_attributes_list[`OP${index}`] = linking.condition;
          question_attributes_label_list.push(linking.condition?.toLowerCase());
        }
        /** add attributes */
        question_attributes_list[linking.variable_name] = [];

        const isRangeOperator = linking.operator === 'Range';

        //response_type: 'Multiple Choice', 'Radio Button', 'Dropdown', 'Descriptive', 'Date', 'Time', 'DateTime', 'Number'
        switch (linking?.question?.response_type) {
          case 'Multiple Choice':
            if (!linking?.values?.length) {
              isNotValid = true;
            }
            if (linking?.values?.length) {
              const attribListCondition = [...linking.values].map((item) => ({ [item.labelKey]: `==${item.value}` }));
              const arrribListLabel = `${linking.variable_name} equals ${[...linking.values]
                .map((item) => item.labelText)
                .join(', ')}`;
              question_attributes_label_list.push(arrribListLabel);
              question_attributes_list[linking.variable_name] = attribListCondition;
            }
            break;
          case 'Radio Button':
          case 'Dropdown':
            if (!linking.values) {
              isNotValid = true;
            }
            if (linking.values) {
              const getFSQAttribute = linking?.question?.FSQAttributes.find(
                (itemAtt) => itemAtt.choice_value === linking.values
              );
              const attribListCondition = [{ [getFSQAttribute.choice_key]: `==${getFSQAttribute.choice_value}` }];
              const arrribListLabel = `${linking.variable_name} equals ${getFSQAttribute.choice_label}`;
              question_attributes_label_list.push(arrribListLabel);
              question_attributes_list[linking.variable_name] = attribListCondition;
            }
            break;
          case 'Descriptive':
            // linked_variable_name push pushed already
            break;
          case 'Number':
            const attrib = linking.question.FSQAttributes[0];
            const valueFrom = parseInt(linking.valueFrom);
            const valueTo = parseInt(linking.valueTo);
            const values = parseInt(linking.values);
            const min = parseInt(attrib?.num_min_value);
            const max = parseInt(attrib?.num_max_value);
            if (isRangeOperator) {
              if (max && (max < valueFrom || max < valueTo)) {
                isNotValid = true;
              }
              if (min && (min > valueFrom || min > valueTo)) {
                isNotValid = true;
              }
            } else {
              if ((max && values > max) || (min && values < min)) {
                isNotValid = true;
              }
            }
            const isRangeNumberfailed =
              isRangeOperator &&
              (Validation.empty(linking.valueFrom) ||
                Validation.empty(linking.valueTo) ||
                getRangeError(linking.valueFrom, linking.valueTo));
            if ((!isRangeOperator && Validation.empty(linking.values)) || isRangeNumberfailed) {
              isNotValid = true;
            } else {
              if (isRangeOperator) {
                const arrribListLabel = `${linking.variable_name} of ${linking.operator} ${linking.valueFrom}-${linking.valueTo}`;
                question_attributes_label_list.push(arrribListLabel);
                question_attributes_list[linking.variable_name] = [
                  { [`number_${linking.operator}`]: `${linking.valueFrom}-${linking.valueTo}` },
                ];
              }
              if (!isRangeOperator) {
                const arrribListLabel = `${linking.variable_name} ${linking.operator}${linking.values}`;
                question_attributes_label_list.push(arrribListLabel);
                question_attributes_list[linking.variable_name] = [
                  { [`number_${linking.operator}`]: `${linking.operator}${linking.values}` },
                ];
              }
            }
            break;
          case 'DateTime':
          case 'Time':
          case 'Date':
            const isDateType = ['Date', 'DateTime'].includes(linking?.question?.response_type);
            const responseTypePrefix = linking?.question?.response_type?.toLowerCase(); //later if needed make/remove lowercase
            const isRangeDatesfailed =
              isRangeOperator &&
              (Validation.empty(linking.valueFrom) ||
                Validation.empty(linking.valueTo) ||
                getDateRangeError(isDateType, linking.valueFrom, linking.valueTo));
            if ((!isRangeOperator && Validation.empty(linking.values)) || isRangeDatesfailed) {
              isNotValid = true;
            } else {
              const values = isDateType ? linking.values : moment(linking.values).format('HH:mm');
              const valuesFrom = isDateType ? linking.valuesFrom : moment(linking.valuesFrom).format('HH:mm');
              const valuesTo = isDateType ? linking.valuesTo : moment(linking.valuesTo).format('HH:mm');

              if (isRangeOperator) {
                const arrribListLabel = `${linking.variable_name} of ${linking.operator} ${valuesFrom}-${valuesTo}`;
                question_attributes_label_list.push(arrribListLabel);
                question_attributes_list[linking.variable_name] = [
                  { [`${responseTypePrefix}_${linking.operator}`]: `${valuesFrom}-${valuesTo}` },
                ];
              }
              if (!isRangeOperator) {
                const arrribListLabel = `${linking.variable_name} ${linking.operator}${values}`;
                question_attributes_label_list.push(arrribListLabel);
                question_attributes_list[linking.variable_name] = [
                  { [`${responseTypePrefix}_${linking.operator}`]: `${linking.operator}${values}` },
                ];
              }
            }
            break;
        }
      });

      if (isNotValid) {
        toast.error('Branching validation failed.');
        return false;
      }

      sendData = {
        linked_variable_name: linked_variable_name,
        question_attributes_list: question_attributes_list,
        question_attributes_label: question_attributes_label_list.join(' '),
        sectionIndex,
        qIndex,
        language,
        isSectionLinking,
      };
      handleClose(sendData);
    }
    if (linkingClause?.length === 0) {
      sendData = {
        linked_variable_name: [],
        question_attributes_list: {},
        question_attributes_label: '',
        sectionIndex,
        qIndex,
        language,
        isSectionLinking,
      };
      handleClose(sendData);
    }
  };

  useEffect(() => {
    try {
      // if(isSectionLinking) {
      //   return;
      // }
      if (customQuestions?.length && Object.entries(question?.question_attributes_list || {}).length) {
        const linkedQuestion = question;
        const tempLinking = [];

        Object.entries(linkedQuestion?.question_attributes_list).forEach(([key, value], index) => {
          let linkClause = {
            condition: 'AND',
            variable_name: '',
            question: '',
            operator: '=',
            values: '',
            valueFrom: '',
            valueTo: '',
          };
          if (!key.includes('OP')) {
            const foundQues = customQuestions.find((elm) => elm.variable_name === key);
            if (index > 0) {
              //get previous OPx condition
              const optionIndex = index / 2;
              linkClause.condition = linkedQuestion?.question_attributes_list[`OP${optionIndex}`];
            }
            if (foundQues) {
              linkClause.question = foundQues;
              linkClause.variable_name = foundQues.variable_name || key;

              switch (foundQues?.response_type) {
                case 'Multiple Choice':
                  if (value?.length) {
                    const selectedChoices = [];
                    const getValueChoiceList = value.map((val) => {
                      const getValueString = Object.values(val)[0];
                      const getChoiceVal = getValueString.split('==')[1];
                      return getChoiceVal?.toString();
                    });
                    foundQues.FSQAttributes.forEach((chItem, i) => {
                      if (getValueChoiceList.includes(chItem.choice_value?.toString())) {
                        selectedChoices.push({
                          label: chItem.choice_label || `Choice ${i + 1}`,
                          labelText: chItem.choice_label,
                          value: chItem.choice_value?.toString(),
                          labelKey: chItem.choice_key,
                        });
                      }
                    });
                    // update selected mulichoices
                    linkClause.values = selectedChoices;
                  }
                  break;
                case 'Radio Button':
                case 'Dropdown':
                  const getValueString = Object.values(value[0])[0];
                  const getChoiceVal = getValueString.split('==')[1];
                  linkClause.values = getChoiceVal?.toString();
                  break;
                case 'Descriptive':
                  // linking.variable_name set already as Descriptive can be only one and no operator/values needed
                  setDescriptiveLinking(true);
                  break;
                case 'Number':
                  const operatorLabels = Object.keys(value[0]) || [];
                  const operatorValues = Object.values(value[0]) || [];
                  const selectedOperator = operatorLabels[0]?.replace('number_', '');

                  if (selectedOperator === 'Range') {
                    linkClause.valueFrom = parseInt(operatorValues[0]?.split('-')[0]);
                    linkClause.valueTo = parseInt(operatorValues[0]?.split('-')[1]);
                  } else {
                    linkClause.values = parseInt(operatorValues[0]?.replace(selectedOperator, ''));
                  }
                  linkClause.operator = selectedOperator;

                  break;
                case 'DateTime':
                case 'Time':
                case 'Date':
                  const responseTypePrefix = foundQues?.response_type?.toLowerCase(); //later if needed make/remove lowercase
                  const dateOperatorLabels = Object.keys(value[0]) || [];
                  const dateOperatorValues = Object.values(value[0]) || [];
                  const selectedDateOperator = dateOperatorLabels[0]?.replace(`${responseTypePrefix}_`, '');

                  if (selectedDateOperator === 'Range') {
                    linkClause.valueFrom = dateOperatorValues[0]?.split('-')[0];
                    linkClause.valueTo = dateOperatorValues[0]?.split('-')[1];
                  } else {
                    linkClause.values = dateOperatorValues[0]?.replace(selectedDateOperator, '');
                  }
                  linkClause.operator = selectedDateOperator;
                  break;
              }
            }

            //create and push each of link clause
            tempLinking.push(linkClause);
          }
        });
        // linking dependency patch data
        setLinkingClause([...tempLinking]);
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong, Bad request data');
    }
  }, [customQuestions, customQuestions?.length]);

  //TODO: wip

  const getRangeError = (fromVal, toVal) => {
    return parseInt(fromVal) >= parseInt(toVal);
  };

  const getDateRangeError = (isDate, fromVal, toVal) => {
    let min;
    let max;
    if (isDate) {
      min = moment(fromVal);
      max = moment(toVal);
      return !max.isSameOrAfter(min);
    } else {
      min = new Date();
      min.setHours(fromVal.split(':')[0]);
      min.setMinutes(fromVal.split(':')[1]);
      min = moment(min);
      max = new Date();
      max.setHours(toVal.split(':')[0]);
      max.setMinutes(toVal.split(':')[1]);
      max = moment(max);
      return fromVal && toVal && !max.isSameOrAfter(min);
    }
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  const isDuplicateVariableName = (variableName) => {
    let found = linkingClause.filter((clause) => clause?.variable_name && clause.variable_name === variableName);
    return found.length > 1 ? true : false;
  };

  const getChoicesForMultiSelect = (attributes) => {
    const choiceOptions = attributes.map((item, i) => ({
      label: item.choice_label || `Choice ${i + 1}`,
      labelText: item.choice_label,
      value: item.choice_value?.toString(),
      labelKey: item.choice_key,
    }));
    return choiceOptions;
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

  const handleLinkingClauseChange = (e, index) => {
    try {
      // condition: 'AND/OR', variable_name: '', operator: '', values: '' question: {},
      let { name, value, type } = e.target;
      // if (!value) {
      //   linkingClause[index][name] = value;
      //   setLinkingClause([...linkingClause]);
      //   return;
      // }
      switch (name) {
        case 'condition':
          linkingClause[index].condition = value;
          break;
        case 'variable_name':
          const found = linkingClause.find((item) => item.variable_name === value);
          const getQuestion = customQuestions.find((itemQ) => itemQ.variable_name === value);
          const operatorVal = ['Multiple Choice', 'Radio Button'].includes(getQuestion?.response_type) ? '==' : '=';
          if (found) {
            //use validation isDuplicateVariableName
            toast.error('Duplicate variable cannot be selected.');
            return;
          }
          if (!getQuestion) {
            return;
          }
          if (getQuestion?.response_type === 'Descriptive') {
            if (index > 0) {
              toast.error('Descriptive question cannot be the part of multi branching.');
              linkingClause[index] = {
                ...linkingClause[index],
                question: '',
                variable_name: '',
                values: '',
                valueFrom: '',
                valueTo: '',
              };
              setLinkingClause([...linkingClause]); //reset variable
              return;
            }
            if (index === 0) {
              setDescriptiveLinking(true); // can be one and to block all operation
            }
          }
          if (getQuestion?.response_type !== 'Descriptive' && index === 0) {
            setDescriptiveLinking(false); // on change reset descriptiveLinking
          }
          linkingClause[index] = {
            ...linkingClause[index],
            question: getQuestion,
            variable_name: value,
            operator: operatorVal,
            values: '',
            valueFrom: '',
            valueTo: '',
          };
          break;
        case 'operator':
          linkingClause[index].operator = value;
          linkingClause[index].values = '';
          linkingClause[index].valueFrom = '';
          linkingClause[index].valueTo = '';
          break;
        case 'values':
          if (linkingClause[index]?.question?.response_type === 'Date') {
            linkingClause[index].values = moment(value).format('MM/DD/YYYY');
          }
          if (linkingClause[index]?.question?.response_type === 'DateTime') {
            linkingClause[index].values = moment(value).format('MM/DD/YYYY hh:mm');
          }
          if (linkingClause[index]?.question?.response_type === 'Time') {
            linkingClause[index].values = moment(value).format('hh:mm');
          }
          if (
            ['Number', 'Radio Button', 'Multiple Choice', 'Dropdown'].includes(linkingClause[index]?.question?.response_type)
          ) {
            linkingClause[index].values = value;
          }
          break;
        case 'valueFrom':
          if (linkingClause[index]?.question?.response_type === 'Date') {
            linkingClause[index].valueFrom = moment(value).format('MM/DD/YYYY');
          }
          if (linkingClause[index]?.question?.response_type === 'DateTime') {
            linkingClause[index].valueFrom = moment(value).format('MM/DD/YYYY hh:mm');
          }
          if (linkingClause[index]?.question?.response_type === 'Time') {
            linkingClause[index].valueFrom = moment(value).format('hh:mm');
          }
          if (linkingClause[index]?.question?.response_type === 'Number') {
            linkingClause[index].valueFrom = value;
          }
          break;
        case 'valueTo':
          if (linkingClause[index]?.question?.response_type === 'Date') {
            linkingClause[index].valueTo = moment(value).format('MM/DD/YYYY');
          }
          if (linkingClause[index]?.question?.response_type === 'DateTime') {
            linkingClause[index].valueTo = moment(value).format('MM/DD/YYYY hh:mm');
          }
          if (linkingClause[index]?.question?.response_type === 'Time') {
            linkingClause[index].valueTo = moment(value).format('hh:mm');
          }
          if (linkingClause[index]?.question?.response_type === 'Number') {
            linkingClause[index].valueTo = value;
          }
          break;
      }
      linkingClause[index][name] = value;
      setLinkingClause([...linkingClause]);
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong, Bad request data');
    }
  };

  const isValidDate = (current, clause, attributeKey = 'datetime') => {
    const attrib = clause?.question?.FSQAttributes[0];
    let min;
    let max;
    min = attrib['min_' + attributeKey]
      ? moment(attrib['min_' + attributeKey]).subtract(23, 'hours')
      : moment().subtract(120, 'years');
    max = attrib['max_' + attributeKey] ? moment(attrib['max_' + attributeKey]) : moment();
    return current.isSameOrAfter(min) && current.isSameOrBefore(max);
  };
  return (
    <>
      <Modal.Header closeButton className="modal-header pb-0">
        <Modal.Title className="title fw-bold">View Link</Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4 ">
        <Form className={`row py-4 ${isDisabledSection ? 'disabled-event' : ''}`}>
          {/* // TODO: new change multiple */}
          <div className={`d-flex flex-column`}>
            <div className={`d-flex `}>
              <div className={`${styles.formDependencyOperatorLabel}`}>And/Or</div>
              <div className={`ms-2 ${styles.formDependencyDropdownLabel}`}>Variable</div>
              <div className={`${styles.formDependencyDropdownLabel}`}>Operator</div>
              <div className={`${styles.formDependencyDropdownLabel} w-300`}>Value</div>
              <div className="">&nbsp;</div>
            </div>

            {linkingClause.map((clause, cIndex) => (
              <div className="d-flex pt-2 mb-3" key={cIndex}>
                <div className={`${styles.formDependencyOperator}`}>
                  <Form.Group controlId="selectQuestion">
                    <Form.Select
                      hidden={cIndex === 0}
                      type="text"
                      name={`condition`}
                      value={clause?.condition}
                      // className={`${styles.formDependencyOperator}`}
                      onChange={(e) => handleLinkingClauseChange(e, cIndex)}
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
                      name={`variable_name`}
                      value={clause?.variable_name}
                      onChange={(e) => handleLinkingClauseChange(e, cIndex)}
                      aria-label="Default select variable_name"
                      isInvalid={
                        isDuplicateVariableName(clause?.variable_name) ||
                        (showErrors && Validation.empty(clause?.variable_name))
                      }
                      required
                      disabled={clause?.loading}
                    >
                      <option value="">Select Variable</option>
                      {customQuestions &&
                        customQuestions.map((question, qIndex) => (
                          <option key={qIndex} value={question?.variable_name}>
                            {question?.variable_name}
                          </option>
                        ))}
                    </Form.Select>
                    {isDuplicateVariableName(clause?.variable_name) && (
                      <Form.Control.Feedback type="invalid">Variable name is already used.</Form.Control.Feedback>
                    )}
                    {showErrors && Validation.empty(clause?.variable_name) && (
                      <Form.Control.Feedback type="invalid">Variable name is required field.</Form.Control.Feedback>
                    )}
                  </Form.Group>
                </div>
                <div className={`${styles.formDependencyDropdown}`}>
                  {!descriptiveLinking && (
                    <Form.Group className="col" controlId="selectQuestion">
                      {!['Multiple Choice', 'Radio Button', 'Dropdown'].includes(clause?.question?.response_type) && (
                        <Form.Select
                          type="text"
                          name={`operator`}
                          onChange={(e) => handleLinkingClauseChange(e, cIndex)}
                          value={clause?.operator}
                          aria-label="Default select operator"
                          isInvalid={showErrors && Validation.empty(clause?.operator)}
                          required
                        >
                          {numberOperators?.map((operator, opIndex) => (
                            <option key={opIndex} value={operator?.value}>
                              {operator?.label}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      {['Multiple Choice', 'Radio Button', 'Dropdown'].includes(clause?.question?.response_type) && (
                        <Form.Select
                          type="text"
                          name={`operator`}
                          onChange={(e) => handleLinkingClauseChange(e, cIndex)}
                          value={clause?.operator}
                          disabled={true}
                          aria-label="Default select operator"
                          isInvalid={showErrors && Validation.empty(clause?.operator)}
                          required
                        >
                          {choicesOperators?.map((operator, opIndex) => (
                            <option key={opIndex} value={operator?.value}>
                              {operator?.label}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      <Form.Control.Feedback type="invalid">Operator is required field.</Form.Control.Feedback>
                    </Form.Group>
                  )}
                </div>

                {/* get values from all resp start */}
                <div className={`${styles.formDependencyDropdown} d-flex w-300`}>
                  {['Radio Button', 'Dropdown'].includes(clause?.question?.response_type) && (
                    <Form.Group className="col" controlId="selectQuestion">
                      <Form.Select
                        type="text"
                        name={`values`}
                        onChange={(e) => handleLinkingClauseChange(e, cIndex)}
                        value={clause?.values}
                        aria-label="Default select value"
                        isInvalid={showErrors && Validation.empty(clause?.values)}
                        required
                      >
                        <option value="">Select Options</option>
                        {clause?.question?.FSQAttributes.map((attribute, inx) => (
                          <option key={inx} value={attribute?.choice_value?.toString()}>
                            {attribute?.choice_label}{' '}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">Choice value is required field.</Form.Control.Feedback>
                    </Form.Group>
                  )}
                  {'Multiple Choice' === clause?.question?.response_type && (
                    <div className="d-flex flex-column w-100">
                      <ReactSelects
                        name={`values`}
                        className={'react-select-multichoice'}
                        options={getChoicesForMultiSelect(clause?.question?.FSQAttributes)}
                        isMulti={true}
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        components={{ Option, MultiValue, animatedComponents }}
                        onChange={(e) => handleLinkingClauseChange(formatEvent(e), cIndex)}
                        allowSelectAll={false}
                        value={clause?.values}
                      />
                      {showErrors && Validation.empty(clause?.values) && (
                        <small className="text-danger">Choice value is required field.</small>
                      )}
                    </div>
                  )}
                  {/* Date, Time , DateTime, Number */}
                  {'Number' === clause?.question?.response_type && (
                    <>
                      {clause?.operator !== 'Range' && (
                        <div className={`col`}>
                          <Form.Group className="mb-3 d-flex flex-column" controlId="exampleForm.ControlInput1">
                            {/* <Form.Label>Set value</Form.Label> */}
                            <FormControl
                              name={`values`}
                              type="number"
                              onKeyDown={(e) => (e.key == 'e' || e.key == 'E') && e.preventDefault()}
                              isInvalid={showErrors && Validation.empty(clause?.values)}
                              onChange={(ev) =>
                                handleLinkingClauseChange(
                                  { target: { id: 'Number', value: ev?.target?.value, name: 'values' } },
                                  cIndex
                                )
                              }
                              value={clause?.values}
                            />
                            <Form.Control.Feedback type="invalid">
                              {Validation.empty(clause?.values) && 'Value is required'}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                      )}
                      {clause?.operator === 'Range' && (
                        <>
                          <div className={`col-md-5`}>
                            <Form.Group className="mb-3" controlId="exampleForm.ControlInput5">
                              <FormControl
                                name={`valueFrom`}
                                type="number"
                                onKeyDown={(e) => (e.key == 'e' || e.key == 'E') && e.preventDefault()}
                                isInvalid={showErrors && Validation.empty(clause?.valueFrom)}
                                onChange={(ev) =>
                                  handleLinkingClauseChange(
                                    { target: { id: 'Number', value: ev?.target?.value, name: 'valueFrom' } },
                                    cIndex
                                  )
                                }
                                value={clause?.valueFrom}
                              />
                              <Form.Control.Feedback type="invalid">
                                {Validation.empty(clause?.valueFrom) && 'From value is required'}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </div>
                          <label className="m-2">To</label>
                          <div className={`col-md-5 `}>
                            <Form.Group className="mb-3" controlId="exampleForm.ControlInput4">
                              <FormControl
                                name={`valueTo`}
                                type="number"
                                onKeyDown={(e) => (e.key == 'e' || e.key == 'E') && e.preventDefault()}
                                isInvalid={
                                  showErrors &&
                                  (Validation.empty(clause?.valueTo) ||
                                    (clause.valueTo && getRangeError(clause.valueFrom, clause.valueTo)))
                                }
                                onChange={(ev) =>
                                  handleLinkingClauseChange(
                                    { target: { id: 'Number', value: ev?.target?.value, name: 'valueTo' } },
                                    cIndex
                                  )
                                }
                                value={clause?.valueTo}
                              />
                              <Form.Control.Feedback type="invalid">
                                {Validation.empty(clause?.valueTo) && 'From value is required'}
                                {clause.valueTo &&
                                  getRangeError(clause.valueFrom, clause.valueTo) &&
                                  'To value must be greater than From'}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {/* Date */}
                  {'Date' === clause?.question?.response_type && (
                    <>
                      {clause?.operator !== 'Range' && (
                        <div className={`col`}>
                          <div className={`${styles.dateTimeIconChild}`} id="Date">
                            <Datetime
                              dateFormat="MM/DD/YYYY"
                              timeFormat={false}
                              isValidDate={(e) => isValidDate(e, clause, 'date')}
                              inputProps={{
                                onChange: (e) => {
                                  return false;
                                },
                              }}
                              initialValue={clause.values ? moment(clause.values) : ''}
                              onChange={(ev) =>
                                handleLinkingClauseChange({ target: { id: 'Date', value: ev, name: 'values' } }, cIndex)
                              }
                            />
                            <img
                              src={'/images/calendar-icon.svg'}
                              onClick={() => openDatepicker(`Date`)}
                              className={`${styles.dateTimeIconImageChildLink}`}
                            ></img>
                          </div>
                          {showErrors && (
                            <small className="text-danger">
                              {Validation.empty(clause.values) && 'From value is required'}
                            </small>
                          )}
                        </div>
                      )}
                      {clause?.operator === 'Range' && (
                        <>
                          <div className={`col-md-5`}>
                            <div className={`${styles.dateTimeIconChild}`} id="DateFrom">
                              <Datetime
                                dateFormat="MM/DD/YYYY"
                                isValidDate={(e) => isValidDate(e, clause, 'date')}
                                timeFormat={false}
                                inputProps={{
                                  onChange: (e) => {
                                    return false;
                                  },
                                }}
                                initialValue={clause.valueFrom ? moment(clause.valueFrom) : ''}
                                onChange={(ev) =>
                                  handleLinkingClauseChange(
                                    { target: { id: 'DateFrom', value: ev, name: 'valueFrom' } },
                                    cIndex
                                  )
                                }
                              />
                              <img
                                src={'/images/calendar-icon.svg'}
                                onClick={() => openDatepicker(`DateFrom`)}
                                className={`${styles.dateTimeIconImageChildLink}`}
                              ></img>
                            </div>
                            {showErrors && (
                              <small className="text-danger">
                                {Validation.empty(clause.valueFrom) && 'From value is required'}
                              </small>
                            )}
                          </div>
                          <label className="m-2">To</label>
                          <div className={`col-md-5 `}>
                            <div className={`${styles.dateTimeIconChild}`} id="DateTo">
                              <Datetime
                                dateFormat="MM/DD/YYYY"
                                isValidDate={(e) => isValidDate(e, clause, 'date')}
                                timeFormat={false}
                                inputProps={{
                                  onChange: (e) => {
                                    return false;
                                  },
                                }}
                                initialValue={clause.valueTo ? moment(clause.valueTo) : ''}
                                onChange={(ev) =>
                                  handleLinkingClauseChange({ target: { id: 'DateTo', value: ev, name: 'valueTo' } }, cIndex)
                                }
                              />
                              <img
                                src={'/images/calendar-icon.svg'}
                                onClick={() => openDatepicker(`DateTo`)}
                                className={`${styles.dateTimeIconImageChildLink}`}
                              ></img>
                            </div>
                            {showErrors && (
                              <>
                                <small className="text-danger">
                                  {Validation.empty(clause.valueTo) && 'To value is required'}
                                </small>
                                <small className="text-danger">
                                  {clause.valueTo &&
                                    getDateRangeError(true, clause.valueFrom, clause.valueTo) &&
                                    'To value must be greater than From'}
                                </small>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* dateTime */}
                  {'DateTime' === clause?.question?.response_type && (
                    <>
                      {clause?.operator !== 'Range' && (
                        <div className={`col`}>
                          <div className={`${styles.dateTimeIconChild}`} id="DateTime">
                            <Datetime
                              timeFormat={'HH:mm'}
                              isValidDate={(e) => isValidDate(e, clause)}
                              dateFormat="MM/DD/YYYY"
                              inputProps={{
                                onChange: (e) => {
                                  return false;
                                },
                              }}
                              initialValue={clause.values ? moment(clause.values) : ''}
                              onChange={(ev) =>
                                handleLinkingClauseChange({ target: { id: 'DateTime', value: ev, name: 'values' } }, cIndex)
                              }
                            />
                            <img
                              src={'/images/calendar-icon.svg'}
                              onClick={() => openDatepicker(`DateTime`)}
                              className={`${styles.dateTimeIconImageChildLink}`}
                            ></img>
                          </div>
                          {showErrors && (
                            <small className="text-danger">
                              {Validation.empty(clause.values) && 'From value is required'}
                            </small>
                          )}
                        </div>
                      )}
                      {clause?.operator === 'Range' && (
                        <>
                          <div className={`col-md-5`}>
                            <div className={`${styles.dateTimeIconChild}`} id="DateTimeFrom">
                              <Datetime
                                timeFormat={'HH:mm'}
                                dateFormat="MM/DD/YYYY"
                                isValidDate={(e) => isValidDate(e, clause)}
                                inputProps={{
                                  onChange: (e) => {
                                    return false;
                                  },
                                }}
                                initialValue={clause.valueFrom ? moment(clause.valueFrom) : ''}
                                onChange={(ev) =>
                                  handleLinkingClauseChange(
                                    { target: { id: 'DateTimeFrom', value: ev, name: 'valueFrom' } },
                                    cIndex
                                  )
                                }
                              />
                              <img
                                src={'/images/calendar-icon.svg'}
                                onClick={() => openDatepicker(`DateTimeFrom`)}
                                className={`${styles.dateTimeIconImageChildLink}`}
                              ></img>
                            </div>
                            {showErrors && (
                              <small className="text-danger">
                                {Validation.empty(clause.valueFrom) && 'From value is required'}
                              </small>
                            )}
                          </div>
                          <label className="m-2">To</label>
                          <div className={`col-md-5 `}>
                            <div className={`${styles.dateTimeIconChild}`} id="DateTimeTo">
                              <Datetime
                                timeFormat={'HH:mm'}
                                dateFormat="MM/DD/YYYY"
                                isValidDate={(e) => isValidDate(e, clause)}
                                inputProps={{
                                  onChange: (e) => {
                                    return false;
                                  },
                                }}
                                initialValue={clause.valueTo ? moment(clause.valueTo) : ''}
                                onChange={(ev) =>
                                  handleLinkingClauseChange(
                                    { target: { id: 'DateTimeTo', value: ev, name: 'valueTo' } },
                                    cIndex
                                  )
                                }
                              />
                              <img
                                src={'/images/calendar-icon.svg'}
                                onClick={() => openDatepicker(`DateTimeTo`)}
                                className={`${styles.dateTimeIconImageChildLink}`}
                              ></img>
                            </div>
                            {showErrors && (
                              <>
                                <small className="text-danger">
                                  {Validation.empty(clause.valueTo) && 'To value is required'}
                                </small>
                                <small className="text-danger">
                                  {clause.valueTo &&
                                    getDateRangeError(true, clause.valueFrom, clause.valueTo) &&
                                    'To value must be greater than From'}
                                </small>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Time */}

                  {'Time' === clause?.question?.response_type && (
                    <>
                      {clause?.operator !== 'Range' && (
                        <div className={`col`}>
                          <div className={`${styles.dateTimeIconChild}`} id="Time">
                            <Datetime
                              timeFormat={'HH:mm'}
                              dateFormat={false}
                              inputProps={{
                                onChange: (e) => {
                                  return false;
                                },
                              }}
                              initialValue={clause.values ? moment(clause.values, 'HH:mm:ss') : ''}
                              onChange={(ev) =>
                                handleLinkingClauseChange({ target: { id: 'Time', value: ev, name: 'values' } }, cIndex)
                              }
                            />
                            <img
                              src={'/images/calendar-icon.svg'}
                              onClick={() => openDatepicker(`Time`)}
                              className={`${styles.dateTimeIconImageChildLink}`}
                            ></img>
                          </div>
                          {showErrors && (
                            <small className="text-danger">
                              {Validation.empty(clause.values) && 'From value is required'}
                            </small>
                          )}
                        </div>
                      )}
                      {clause?.operator === 'Range' && (
                        <>
                          <div className={`col-md-5`}>
                            <div className={`${styles.dateTimeIconChild}`} id="TimeFrom">
                              <Datetime
                                timeFormat={'HH:mm'}
                                dateFormat={false}
                                inputProps={{
                                  onChange: (e) => {
                                    return false;
                                  },
                                }}
                                initialValue={clause.valueFrom ? moment(clause.valueFrom, 'HH:mm:ss') : ''}
                                onChange={(ev) =>
                                  handleLinkingClauseChange(
                                    { target: { id: 'TimeFrom', value: ev, name: 'valueFrom' } },
                                    cIndex
                                  )
                                }
                              />
                              <img
                                src={'/images/calendar-icon.svg'}
                                onClick={() => openDatepicker(`TimeFrom`)}
                                className={`${styles.dateTimeIconImageChildLink}`}
                              ></img>
                            </div>
                            {showErrors && (
                              <small className="text-danger">
                                {Validation.empty(clause.valueFrom) && 'From value is required'}
                              </small>
                            )}
                          </div>
                          <label className="m-2">To</label>
                          <div className={`col-md-5 `}>
                            <div className={`${styles.dateTimeIconChild}`} id="TimeTo">
                              <Datetime
                                timeFormat={'HH:mm'}
                                dateFormat={false}
                                inputProps={{
                                  onChange: (e) => {
                                    return false;
                                  },
                                }}
                                initialValue={clause.valueTo ? moment(clause.valueTo, 'HH:mm:ss') : ''}
                                onChange={(ev) =>
                                  handleLinkingClauseChange({ target: { id: 'TimeTo', value: ev, name: 'valueTo' } }, cIndex)
                                }
                              />
                              <img
                                src={'/images/calendar-icon.svg'}
                                onClick={() => openDatepicker(`TimeTo`)}
                                className={`${styles.dateTimeIconImageChildLink}`}
                              ></img>
                            </div>
                            {showErrors && (
                              <>
                                <small className="text-danger">
                                  {Validation.empty(clause.valueTo) && 'To value is required'}
                                </small>
                                <small className="text-danger">
                                  {clause.valueTo &&
                                    getDateRangeError(false, clause.valueFrom, clause.valueTo) &&
                                    'To value must be greater than From'}
                                </small>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex-item p-2">
                  <img
                    src={'/images/cross.svg'}
                    data-toggle="tooltip"
                    title="Delete"
                    height={15}
                    className="cursor-pointer mx-2"
                    onClick={() => removeLinkingClause(cIndex)}
                  />
                </div>
              </div>
            ))}

            <div className="d-flex flex-row mb-3">
              {!descriptiveLinking && linkingClause?.length < 6 && (
                <div className="cursor-pointer mt-2" onClick={addLinkingClause}>
                  <img
                    className={`${styles.addTextIcon} me-2`}
                    src={'/images/plus-icon.svg'}
                    data-toggle="tooltip"
                    title="Add Clause"
                  ></img>
                  <span className={`${styles.defaultBoldText}`}>Add New Clause</span>
                </div>
              )}
            </div>
          </div>
          {/* // TODO: end new change multiple ############################################ */}
        </Form>
      </Modal.Body>
      {customQuestions && (
        <Modal.Footer className="modal-footer">
          <Button className="mx-3" variant="secondary" size="md" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={addChildBranching} disabled={isDisabledSection}>
            Add
          </Button>
        </Modal.Footer>
      )}
    </>
  );
};

export default ChildLinkModal;
