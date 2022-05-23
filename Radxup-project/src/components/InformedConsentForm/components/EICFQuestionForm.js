import Validation from '../../../utils/validations';
import { Button, Modal, Form, InputGroup, FormCheck } from 'react-bootstrap';
import CDEQuestion from './CDEQuestion';
import { selectedRequiredCDEQuestion } from '../../../store/actions/eicforms';
import Datetime from 'react-datetime';
import moment from 'moment';
import 'react-datetime/css/react-datetime.css';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { toast } from 'react-toastify';
const EICFQuestionForm = (props) => {
  const {
    questionData,
    language,
    setShowErrors,
    showErrors,
    setQuestionData,
    CDEList = [],
    styles,
    languageList,
    languageListPicked,
    changeLanguage,
  } = props;
  const dispatch = useDispatch();
  const [dragId, setDragId] = useState('');

  const addQuestion = (sectionIndex) => {
    questionData.map((data) => {
      data.FSQuestions.push({
        question_type: '',
        question_edited: false,
        question: '',
        hint: '',
        linked_level: 0,
        language: data.language,
        FSQAttributes: [
          {
            not_to_ans: true,
            attribute_edited: false,
            choice_key: 'choice_1',
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
      });
    });

    setQuestionData([...questionData]);
  };

  // const changeLanguage = (lang, sectionIndex, questionIndex) => {
  //   FormsSections[sectionIndex].FSQuestions[questionIndex].language = lang;
  //   setQuestionData({ ...state, FormsSections: [...FormsSections] });
  // };

  const isValidDate = function (current) {
    const yesterday = moment().subtract(0, 'day');
    return yesterday.isAfter(current);
  };

  const addQuestionChoice = (questionIndex) => {
    questionData.map((data) => {
      const variableName = data.FSQuestions[questionIndex].variable_name;

      if (!data.FSQuestions[questionIndex].FSQAttributes && !data.FSQuestions[questionIndex].FSQAttributes.length) {
        data.FSQuestions[questionIndex].FSQAttributes = [
          {
            choice_key: `${variableName}_1`,
            choice_label: '',
            choice_value: '',
            attribute_edited: false,
            response_type: data.FSQuestions[questionIndex].response_type,
            max_date: '',
            max_datetime: '',
            max_time: '',
            min_date: '',
            min_datetime: '',
            min_time: '',
            num_flot_max: '',
            num_max_value: '',
            num_min_value: '',
            text_max_char: '',
            text_min_char: '',
          },
        ];
        setQuestionData([...questionData]);
      }

      if (data.FSQuestions[questionIndex].FSQAttributes && !data.FSQuestions[questionIndex].FSQAttributes.length < 8) {
        const length = data.FSQuestions[questionIndex].FSQAttributes.length;
        data.FSQuestions[questionIndex].FSQAttributes.push({
          choice_key: `${variableName}_${length + 1}`,
          choice_label: '',
          attribute_edited: false,
          choice_value: '',
          response_type: data.FSQuestions[questionIndex].response_type,
          not_to_ans: true,
          max_date: '',
          max_datetime: '',
          max_time: '',
          min_date: '',
          min_datetime: '',
          min_time: '',
          num_flot_max: '',
          num_max_value: '',
          num_min_value: '',
          text_max_char: '',
          text_min_char: '',
        });
        setQuestionData([...questionData]);
      }
    });
  };

  const removeQuestionChoice = (questionIndex, choiceIndex, questionLanguage) => {
    questionData.map((item) => {
      if (item.FSQuestions[questionIndex].FSQAttributes.length > 1) {
        item.FSQuestions[questionIndex].FSQAttributes.splice(choiceIndex, 1);
      }
    });
    setQuestionData([...questionData]);
  };

  const removeQuestion = (index, que) => {
    if (que?.dependent) {
      toast.error('Not allwed, its dependent question');
      return;
    }
    questionData.map((item) => {
      item.FSQuestions.splice(index, 1);
    });
    setQuestionData([...questionData]);
  };

  const handleChange = (event) => {
    // setShowErrors(false);
    const _name = event.target.name.split('.');
    let node = questionData;
    let sameAcrossAllLanguage = [
      'variable_name',
      'response_type',
      'question_type',
      'not_to_ans',
      'choice_value',
      'max_date',
      'max_datetime',
      'max_time',
      'min_date',
      'min_datetime',
      'min_time',
      'num_flot_max',
      'num_max_value',
      'num_min_value',
      'text_max_char',
      'text_min_char',
    ];
    if (_name.length === 3) {
      if (event.target.isCDE) {
        let f = node.find((data) => data.language == language);
        const oldData = JSON.parse(JSON.stringify(f[_name[0]][_name[1]]));
        let currentLanguageCDEs = CDEList.find((item) => item.language == language);
        let question = currentLanguageCDEs.questions.find((que) => que.variable_name === event.target.value);
        dispatch(selectedRequiredCDEQuestion(oldData, question));
      }
      node.map((data) => {
        if (!event.target.isCDE) {
          if (sameAcrossAllLanguage.includes(_name[2])) {
            data[_name[0]][_name[1]][_name[2]] = event.target.value;
            if (_name[2] == 'response_type') {
              data[_name[0]][_name[1]].FSQAttributes = [
                {
                  choice_key: `${data[_name[0]][_name[1]][_name[2]]}_${length + 1}`,
                  choice_label: '',
                  choice_value: '',
                  response_type: data[_name[0]][_name[1]].response_type,
                  not_to_ans: true,
                  attribute_edited: false,
                  max_date: '',
                  max_datetime: '',
                  max_time: '',
                  min_date: '',
                  min_datetime: '',
                  min_time: '',
                  num_flot_max: '',
                  num_max_value: '',
                  num_min_value: '',
                  text_max_char: '',
                  text_min_char: '',
                },
              ];
            }
          } else if (data[_name[0]][_name[1]].language === language) {
            data[_name[0]][_name[1]][_name[2]] = event.target.value;
          } else {
            data[_name[0]][_name[1]][_name[2]] = data[_name[0]][_name[1]][_name[2]] || '';
          }
        } else {
          let list = CDEList.find((item) => item.language == data.language);
          if (list) {
            list = list.questions;
            const langQuestion = list.find((que) => que?.variable_name === event?.target?.value);
            const alreadyPresent = data.FSQuestions.find((que) => que?.variable_name === event?.target?.value);
            if (langQuestion && !alreadyPresent) {
              if (event.target.isCDE) {
                data[_name[0]][_name[1]].question_edited = true;
              }
              data[_name[0]][_name[1]] = {
                ...data[_name[0]][_name[1]],
                ...langQuestion,
              };
            }
          }
        }
      });
    }
    if (_name.length === 5) {
      const value = _name[4] == 'not_to_ans' ? event.target.checked : event.target.value;
      node.forEach((data) => {
        if (sameAcrossAllLanguage.includes(_name[4])) {
          data[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]] = value;
        } else if (data[_name[0]][_name[1]].language === language) {
          data[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]] = value;
        }
      });
    }

    setQuestionData([...node]);
  };
  const handleDateTime = (info, statePath, format) => {
    const _name = statePath.split('.');
    let node = questionData;
    if (_name.length === 5) {
      let value = '';
      switch (format) {
        case 'toISOString':
          value = moment(info).toISOString();
          break;
        case 'toDate':
          value = moment(info).format('yyyy-MM-DD');
          break;
        case 'toTime':
          value = moment(info).format('HH:mm:ss');
          break;
      }

      node.map((data) => {
        data[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]] = value;
      });
    }

    setQuestionData([...node]);
  };
  const handleBlur = (event) => {
    const _name = event.target.name.split('.');
    questionData.map((item) => {
      item.FSQuestions.map((que, outerIndex) => {
        let isFound = item.FSQuestions.find((v, i) => v.variable_name === que.variable_name && i !== outerIndex);
        if (isFound) {
          que.hasError = true;
        } else {
          que.hasError = false;
        }
      });
    });
    setQuestionData([...questionData]);
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`datetimepicker${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  //Question drag drop
  const handleDrag = (ev) => {
    setDragId(ev.currentTarget.id);
  };

  const handleDrop = (ev) => {
    if (!dragId) {
      return;
    }
    questionData.map((item) => {
      let removed = item.FSQuestions.splice(dragId, 1);
      item.FSQuestions.splice(ev.currentTarget.id, 0, removed[0]);
      item.FSQuestions.forEach((question, index) => {
        item.FSQuestions[index].order = index + 1;
      });
    });
    setQuestionData([...questionData]);
  };

  let selectedLanguageData = questionData.find((data) => data.language === language);
  return (
    <>
      <div className={`sectionBody`}>
        {selectedLanguageData?.FSQuestions &&
          selectedLanguageData?.FSQuestions?.map((que, qIndex) => (
            <div
              className={`${styles.questionWrapper}`}
              key={qIndex}
              onDragOver={(ev) => ev.preventDefault()}
              id={qIndex}
              onDrop={(e) => handleDrop(e, qIndex)}
            >
              <div className={`row p-0 m-0 d-flex flex-wrap`}>
                <div className={`col-md-2 ${styles.sectionTitle}`}>Question {qIndex + 1}</div>
                <div className="col-md-4 d-flex align-items-end p-0">
                  {/* {!!que?.linked_variable_name?.length && (
                    <img
                      src={'/images/child-branching.png'}
                      data-toggle="tooltip"
                      title="Child Branching Question"
                      height={24}
                      className="cursor-pointerx me-2 d-flex mb-2"
                    />
                  )} */}
                  <Form.Group className="col" controlId="selectQuestion">
                    <Form.Select
                      type="text"
                      name={`FSQuestions.${qIndex}.question_type`}
                      placeholder="Add Question"
                      onChange={handleChange}
                      value={que?.question_type}
                      className={`${styles.icfDropdownNormal}`}
                      aria-label="Default select question type"
                      disabled={
                        que?.question_type === 'CDE Question' ||
                        (que.cde_id && que?.linked_variable_name?.length) ||
                        que.language === 'Spanish'
                      }
                      isInvalid={showErrors && Validation.empty(que.question_type)}
                      required
                    >
                      <option value="">Select Question Type</option>
                      <option value="CDE Question">CDE Question </option>
                      <option value="Custom Question">Custom Question </option>
                    </Form.Select>
                    {/* <Form.Control.Feedback type="invalid">Question is required field.</Form.Control.Feedback> */}
                  </Form.Group>

                  {/* {
                    // !que?.child_node &&
                    (que?.linked_variable_name?.length ||
                      (item.FSQuestions.length > 1 &&
                        ['Custom Question', 'CDE Question'].includes(que?.question_type))) && (
                      <img
                        src={'/images/child-links.svg'}
                        data-toggle="tooltip"
                        title="Child Question link"
                        height={36}
                        className="cursor-pointer mx-2"
                        onClick={() => openChildQuestionLinkModal(que, index, qIndex)}
                      />
                    )
                  } */}
                  {selectedLanguageData?.FSQuestions?.length > 0 &&
                    !(que?.linked_variable_name?.length && que?.question_type === 'CDE Question') && (
                      <img
                        src={'/images/delete-form-item.svg'}
                        data-toggle="tooltip"
                        title="Delete"
                        height={36}
                        className="cursor-pointer mx-2"
                        onClick={() => removeQuestion(qIndex, que)}
                      />
                    )}
                </div>
                <div className="col-md-5 d-flex justify-content-end align-items-center ms-5">
                  {languageListPicked.map((langItem, index) => (
                    <button
                      key={index}
                      onClick={changeLanguage}
                      name={langItem}
                      className={`btn mx-1 ${langItem === language ? 'btn-secondary' : 'btn-gray'}`}
                    >
                      {langItem}
                    </button>
                  ))}
                  <div
                    className={`ms-5 float-end `}
                    key={qIndex}
                    draggable={true}
                    onDragOver={(ev) => ev.preventDefault()}
                    onDragStart={(e) => handleDrag(e, qIndex)}
                    id={qIndex}
                  >
                    <img
                      src={'/images/dnd.svg'}
                      data-toggle="tooltip"
                      title="Drag"
                      height={22}
                      className="cursor-pointer ms-2"
                    />
                  </div>
                </div>
                {showErrors && Validation.empty(que.question_type) && (
                  <span className={`${styles.cstInvalidFeedback} `}>Question type is required field.</span>
                )}
              </div>

              {/* question type inputs Custom */}
              {que.question_type === 'Custom Question' && (
                <div className="d-flex flex-column">
                  <Form.Group className="col me-5 mt-2" controlId="sectionQuestion">
                    <Form.Control
                      type="text"
                      name={`FSQuestions.${qIndex}.question`}
                      placeholder="Question"
                      onChange={handleChange}
                      value={que.question}
                      maxLength="150"
                      isInvalid={showErrors && Validation.empty(que.question)}
                      required
                    />
                    <Form.Control.Feedback type="invalid">Question is required field.</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="col me-5 mt-2" controlId="sectionHint">
                    <Form.Control
                      type="text"
                      name={`FSQuestions.${qIndex}.hint`}
                      placeholder="Hint"
                      onChange={handleChange}
                      value={que.hint}
                      maxLength="150"
                      // isInvalid={showErrors && Validation.empty(que.hint)}
                      required
                    />
                    {/* <Form.Control.Feedback type="invalid">Hint is required field.</Form.Control.Feedback> */}
                  </Form.Group>
                  <div className="d-flex mb-2 ps-3">
                    <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                      <div className="pe-2"> Variable Name: </div>
                      <Form.Group className="col me-5 my-2" controlId="sectionHint">
                        <Form.Control
                          type="text"
                          name={`FSQuestions.${qIndex}.variable_name`}
                          placeholder=""
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={que.variable_name}
                          maxLength="50"
                          disabled={que.language !== 'English'}
                          isInvalid={(showErrors && Validation.empty(que.variable_name)) || que.hasError}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {que.hasError ? 'Variable name is already used!' : 'Variable name is required field.'}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>
                    <div className={`${styles.defaultText} d-flex align-items-center`}>
                      <div className="pe-2">Response Type: </div>
                      <Form.Group className="col" controlId="selectQuestion">
                        <Form.Select
                          type="text"
                          name={`FSQuestions.${qIndex}.response_type`}
                          placeholder="Add Question"
                          onChange={handleChange}
                          value={que.response_type}
                          className={`${styles.icfDropdownNormal}`}
                          aria-label="Default select question type"
                          isInvalid={showErrors && Validation.empty(que.response_type)}
                          disabled={que.language !== 'English'}
                          required
                        >
                          <option value="">Select Response Type</option>
                          <option value="Radio Button">Radio Button </option>
                          <option value="Multiple Choice">Multiple Choice </option>
                          <option value="Dropdown">Dropdown </option>
                          <option value="Text Box">Text Box</option>
                          <option value="Number">Number</option>
                          <option value="Date">Date </option>
                          <option value="DateTime">DateTime </option>
                          <option value="Time">Time </option>
                          {/* <option value="Descriptive">Descriptive </option> */}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">Response type is required field.</Form.Control.Feedback>
                      </Form.Group>
                    </div>
                  </div>

                  {/* FSQAttributes and responses choice type */}
                  <>
                    {que.response_type && ['Multiple Choice', 'Radio Button', 'Dropdown'].includes(que.response_type) && (
                      <div className="d-flex flex-column ps-3">
                        <div className={`d-flex justify-content-end mt-1 me-5 data-table`}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              name={`FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                              checked={que.FSQAttributes[0]?.not_to_ans}
                              onChange={handleChange}
                              disabled={que.language !== 'English'}
                              type="checkbox"
                              value=""
                              id="flexCheckDefault"
                            />
                          </div>
                          <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                        </div>
                        {que.FSQAttributes && que.FSQAttributes.length > 0 && (
                          <div className="row p-0">
                            <div className={`col-md-12 me-5 ms-1 ${styles.cdeOptionsTable}`}>
                              <table>
                                <tr>
                                  <th>Sl.No</th>
                                  <th>Choices</th>
                                  <th>Values</th>
                                  <th></th>
                                </tr>
                                {que.FSQAttributes.map((chItem, chIndex) => (
                                  <tr key={chIndex}>
                                    <td>
                                      <div className={`me-1 ${styles.choiceTitle}`}>
                                        {`Choice ${chIndex + 1 || chItem.choice_key}`}
                                      </div>
                                    </td>
                                    <td>
                                      <Form.Group className="col my-2" controlId="choice-label">
                                        <Form.Control
                                          type="text"
                                          name={`FSQuestions.${qIndex}.FSQAttributes.${chIndex}.choice_label`}
                                          placeholder=""
                                          onChange={handleChange}
                                          value={chItem.choice_label}
                                          maxLength="50"
                                          isInvalid={showErrors && Validation.empty(chItem.choice_label)}
                                          required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Choice label is required field.
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                    </td>
                                    <td>
                                      <Form.Group className={`col my-2 ${styles.choiceValueInput}`} controlId="choice-value">
                                        <Form.Control
                                          type="text"
                                          name={`FSQuestions.${qIndex}.FSQAttributes.${chIndex}.choice_value`}
                                          placeholder=""
                                          onChange={handleChange}
                                          value={chItem.choice_value}
                                          disabled={que.language !== 'English'}
                                          maxLength="50"
                                          isInvalid={showErrors && Validation.empty(chItem.choice_value)}
                                          required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          Choice value is required field.
                                        </Form.Control.Feedback>
                                      </Form.Group>
                                    </td>
                                    <td>
                                      <img
                                        className={`${styles.addTextIcon} ${
                                          que.child_node ? 'cursor-not-allowed' : 'cursor-pointer'
                                        } me-2`}
                                        onClick={() =>
                                          que.language !== 'Spanish' &&
                                          !que.child_node &&
                                          removeQuestionChoice(qIndex, chIndex, que.language)
                                        }
                                        src={'/images/cross-icon.svg'}
                                        data-toggle="tooltip"
                                        title={que.child_node ? 'Cannot delete Child linked choice' : 'Delete Choice'}
                                      ></img>
                                    </td>
                                  </tr>
                                ))}
                              </table>
                            </div>
                          </div>
                        )}
                        <div className="d-flex mt-2">
                          {(!que.FSQAttributes || (que.FSQAttributes && que.FSQAttributes.length < 9)) && (
                            <button
                              disabled={que.language !== 'English'}
                              className="btn btn-secondary mx-1"
                              onClick={() => addQuestionChoice(qIndex, que.language)}
                            >
                              Add Choice
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>

                  {/* responses textbox , min max char, not to answer */}
                  <>
                    {que.response_type && que.response_type === 'Text Box' && (
                      <div className="d-flex flex-row ps-3">
                        <div className="d-flex flex-column">
                          <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                            <div className="pe-2"> Minimum Character limit </div>
                            <Form.Group className={`colx me-5 my-2 ${styles.choiceValueInput}`} controlId="minChar">
                              <Form.Control
                                type="number"
                                name={`FSQuestions.${qIndex}.FSQAttributes.0.text_min_char`}
                                placeholder=""
                                onChange={(e) => e?.target?.value <= 999 && handleChange(e)}
                                value={que.FSQAttributes[0]?.text_min_char}
                                disabled={que.language !== 'English'}
                                onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                // isInvalid={
                                //   showErrors && Validation.empty(que.FSQAttributes[0].text_min_char)
                                // }
                                max="999"
                                maxLength="3"
                                required
                              />
                              {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                            </Form.Group>
                          </div>
                          <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                            <div className="pe-2">
                              Maximum Character limit
                              <br />
                              (Max Limit 1024)
                            </div>
                            <Form.Group className={`colx me-5 my-2 ${styles.choiceValueInput}`} controlId="maxChar">
                              <Form.Control
                                type="number"
                                onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                name={`FSQuestions.${qIndex}.FSQAttributes.0.text_max_char`}
                                placeholder=""
                                disabled={que.language !== 'English'}
                                // onChange={handleChange}
                                onChange={(e) => e?.target?.value <= 1024 && handleChange(e)}
                                value={que.FSQAttributes[0]?.text_max_char}
                                // isInvalid={
                                //   showErrors && Validation.empty(que.FSQAttributes[0].text_max_char)
                                // }
                                max="1024"
                                maxLength="4"
                                required
                              />
                              {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                            </Form.Group>
                          </div>
                        </div>
                        <div className={`d-flex mt-4 ms-4 data-table`}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              disabled={que.language !== 'English'}
                              name={`FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                              checked={que.FSQAttributes[0]?.not_to_ans}
                              onChange={handleChange}
                              type="checkbox"
                              value=""
                              id="flexCheckDefault"
                            />
                          </div>
                          <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                        </div>
                      </div>
                    )}
                  </>
                  {/* responses Number , min max char, not to answer */}
                  <>
                    {que.response_type && que.response_type === 'Number' && (
                      <div className="d-flex flex-row ps-3">
                        <div className="d-flex flex-column">
                          <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                            <div className="pe-2">
                              {' '}
                              Minimum Value Accepted <br />
                              (Min Number Limit -999999){' '}
                            </div>
                            <Form.Group className={`colx me-3 my-2 ${styles.choiceValueInput}`} controlId="minChar">
                              <Form.Control
                                type="number"
                                onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                name={`FSQuestions.${qIndex}.FSQAttributes.0.num_min_value`}
                                placeholder=""
                                onChange={handleChange}
                                value={que.FSQAttributes[0]?.num_min_value}
                                disabled={que.language !== 'English'}
                                // isInvalid={
                                //   showErrors && Validation.empty(que.FSQAttributes[0].num_min_value)
                                // }
                                min="-999999"
                                maxLength="6"
                                required
                              />
                              {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                            </Form.Group>
                          </div>
                          <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                            <div className="pe-2">
                              {' '}
                              Maximum Value Accepted <br />
                              (Max Number Limit 999999){' '}
                            </div>
                            <Form.Group className={`colx me-3 my-2 ${styles.choiceValueInput}`} controlId="maxChar">
                              <Form.Control
                                type="number"
                                onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                name={`FSQuestions.${qIndex}.FSQAttributes.0.num_max_value`}
                                placeholder=""
                                disabled={que.language !== 'English'}
                                // onChange={handleChange}
                                onChange={(e) => e?.target?.value <= 999999 && handleChange(e)}
                                value={que.FSQAttributes[0]?.num_max_value}
                                // isInvalid={
                                //   showErrors && Validation.empty(que.FSQAttributes[0].num_max_value)
                                // }
                                max="999999"
                                maxLength="6"
                                required
                              />
                              {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                            </Form.Group>
                          </div>
                        </div>
                        <div className="d-flex flex-column">
                          <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                            <div className="pe-2">
                              {' '}
                              Allowed Decimal Value <br />
                              (Max Decimal Limit 3){' '}
                            </div>
                            <Form.Group className={`colx me-5 my-2 ${styles.choiceValueInput}`} controlId="minChar">
                              <Form.Control
                                type="number"
                                onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                name={`FSQuestions.${qIndex}.FSQAttributes.0.num_flot_max`}
                                placeholder=""
                                disabled={que.language !== 'English'}
                                // onChange={handleChange}
                                onChange={(e) => e?.target?.value <= 3 && handleChange(e)}
                                value={que.FSQAttributes[0]?.num_flot_max}
                                // isInvalid={
                                //   showErrors && Validation.empty(que.FSQAttributes[0].num_flot_max)
                                // }
                                max="3"
                                maxLength="1"
                                required
                              />
                              {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                            </Form.Group>
                          </div>
                        </div>
                        <div className={`d-flex mt-1 ms-4 data-table`}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              disabled={que.language !== 'English'}
                              name={`FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                              checked={que.FSQAttributes[0]?.not_to_ans}
                              onChange={handleChange}
                              type="checkbox"
                              value=""
                              id="flexCheckDefault"
                            />
                          </div>
                          <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                        </div>
                      </div>
                    )}
                  </>

                  {/* response type is  'Descriptive'  */}
                  <>
                    {que.response_type === 'Descriptive' && (
                      <div className="d-flex flex-row mt-2 mb-2 align-items-center"></div>
                    )}
                  </>

                  {/* responses 'DateTime' > min_datetime, max_datetime, Date: min_date, max_date, Time: min_time,max_time */}
                  <>
                    {que.response_type && ['Date', 'DateTime', 'Time'].includes(que.response_type) && (
                      <div className="d-flex row p-0 mt-3 ps-3">
                        <div className="col-md-6 d-flex flex-column">
                          <div className={`${styles.defaultText}`}>Set Acceptable {que.response_type} Range</div>
                        </div>

                        <div className={`col-md-4 d-flex mt-1 ms-4 data-table`}>
                          {que.response_type !== 'Time' && (
                            <>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  disabled={que.language !== 'English'}
                                  name={`FSQuestions.${qIndex}.FSQAttributes.0.max_current_datetime`}
                                  checked={que.FSQAttributes[0]?.max_current_datetime}
                                  onChange={handleChange}
                                  type="checkbox"
                                  value=""
                                  id="flexCheckDefault"
                                />
                              </div>
                              <div className={`${styles.defaultText}`}>Set limit to current date</div>
                            </>
                          )}
                        </div>

                        <div className="col-md-6 d-flex flex-column">
                          {/* <div className={`${styles.defaultText}`}>Set Acceptable Date Range</div> */}
                          {que.response_type === 'Date' && (
                            <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                              <div
                                className={`${styles.dateTimeIcon}`}
                                id={`datetimepicker${que.response_type}${qIndex}from`}
                              >
                                <Datetime
                                  dateFormat="MM/DD/YYYY"
                                  className={`${styles.defaultDateTimeText}`}
                                  inputProps={{
                                    disabled: que?.FSQAttributes[0]?.max_current_datetime || que.language !== 'English',
                                    onChange: (e) => {
                                      return false;
                                    },
                                  }}
                                  isValidDate={isValidDate}
                                  initialValue={
                                    que?.FSQAttributes[0]?.min_date ? moment(que.FSQAttributes[0]?.min_date) : ''
                                  }
                                  onChange={(ev) =>
                                    handleDateTime(ev, `FSQuestions.${qIndex}.FSQAttributes.0.min_date`, 'toDate')
                                  }
                                  timeFormat={false}
                                />
                                <img
                                  src={'/images/calendar-icon.svg'}
                                  className={`${styles.dateTimeIconImage}`}
                                  onClick={() => openDatepicker(`${que.response_type}${qIndex}from`)}
                                ></img>
                              </div>
                              <div className={`${styles.defaultText} px-3`}>To</div>
                              <div className={`${styles.dateTimeIcon}`} id={`datetimepicker${que.response_type}${qIndex}to`}>
                                <Datetime
                                  dateFormat="MM/DD/YYYY"
                                  timeFormat={false}
                                  inputProps={{
                                    disabled: que?.FSQAttributes[0]?.max_current_datetime || que.language !== 'English',
                                    onChange: (e) => {
                                      return false;
                                    },
                                  }}
                                  className={`${styles.defaultDateTimeText}`}
                                  isValidDate={isValidDate}
                                  initialValue={
                                    que?.FSQAttributes[0]?.max_date ? moment(que?.FSQAttributes[0]?.max_date) : ''
                                  }
                                  onChange={(ev) =>
                                    handleDateTime(ev, `FSQuestions.${qIndex}.FSQAttributes.0.max_date`, 'toDate')
                                  }
                                />
                                <img
                                  src={'/images/calendar-icon.svg'}
                                  className={`${styles.dateTimeIconImage}`}
                                  onClick={() => openDatepicker(`${que.response_type}${qIndex}to`)}
                                ></img>
                              </div>
                            </div>
                          )}
                          {que.response_type === 'DateTime' && (
                            <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                              <div
                                className={`${styles.dateTimeIcon}`}
                                id={`datetimepicker${que.response_type}${qIndex}from`}
                              >
                                <Datetime
                                  dateFormat="MM/DD/YYYY;"
                                  timeFormat="HH:mm"
                                  className={`${styles.defaultDateTimeText}`}
                                  inputProps={{
                                    disabled: que?.FSQAttributes[0]?.max_current_datetime || que.language !== 'English',
                                    onChange: (e) => {
                                      return false;
                                    },
                                  }}
                                  isValidDate={isValidDate}
                                  initialValue={
                                    que?.FSQAttributes[0]?.min_datetime ? moment(que?.FSQAttributes[0]?.min_datetime) : ''
                                  }
                                  onChange={(ev) =>
                                    handleDateTime(ev, `FSQuestions.${qIndex}.FSQAttributes.0.min_datetime`, 'toISOString')
                                  }
                                />
                                <img
                                  src={'/images/calendar-icon.svg'}
                                  className={`${styles.dateTimeIconImage}`}
                                  onClick={() => openDatepicker(`${que.response_type}${qIndex}from`)}
                                ></img>
                              </div>
                              <div className={`${styles.defaultText} px-3`}>To</div>
                              <div className={`${styles.dateTimeIcon}`} id={`datetimepicker${que.response_type}${qIndex}to`}>
                                <Datetime
                                  dateFormat="MM/DD/YYYY;"
                                  timeFormat="HH:mm"
                                  inputProps={{
                                    disabled: que?.FSQAttributes[0]?.max_current_datetime || que.language !== 'English',
                                    onChange: (e) => {
                                      return false;
                                    },
                                  }}
                                  className={`${styles.defaultDateTimeText}`}
                                  isValidDate={isValidDate}
                                  initialValue={
                                    que?.FSQAttributes[0]?.max_datetime ? moment(que?.FSQAttributes[0]?.max_datetime) : ''
                                  }
                                  onChange={(ev) =>
                                    handleDateTime(ev, `FSQuestions.${qIndex}.FSQAttributes.0.max_datetime`, 'toISOString')
                                  }
                                />
                                <img
                                  src={'/images/calendar-icon.svg'}
                                  className={`${styles.dateTimeIconImage}`}
                                  onClick={() => openDatepicker(`${que.response_type}${qIndex}to`)}
                                ></img>
                              </div>
                            </div>
                          )}
                          {que.response_type === 'Time' && (
                            <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                              <div
                                className={`${styles.dateTimeIcon}`}
                                id={`datetimepicker${que.response_type}${qIndex}from`}
                              >
                                <Datetime
                                  dateFormat={false}
                                  timeFormat="HH:mm"
                                  className={`${styles.defaultDateTimeText}`}
                                  inputProps={{
                                    disabled: que?.FSQAttributes[0]?.max_current_datetime || que.language !== 'English',
                                    onChange: (e) => {
                                      return false;
                                    },
                                  }}
                                  initialValue={
                                    que?.FSQAttributes[0]?.min_time
                                      ? moment(que?.FSQAttributes[0]?.min_time, 'HH:mm:ss')
                                      : ''
                                  }
                                  onChange={(ev) =>
                                    handleDateTime(ev, `FSQuestions.${qIndex}.FSQAttributes.0.min_time`, 'toTime')
                                  }
                                />
                                <img
                                  src={'/images/clock-icon.svg'}
                                  onClick={() => openDatepicker(`${que.response_type}${qIndex}from`)}
                                  className={`${styles.dateTimeIconImage}`}
                                ></img>
                              </div>
                              <div className={`${styles.defaultText} px-3`}>To </div>
                              <div className={`${styles.dateTimeIcon}`} id={`datetimepicker${que.response_type}${qIndex}to`}>
                                <Datetime
                                  dateFormat={false}
                                  timeFormat="HH:mm"
                                  className={`${styles.defaultDateTimeText}`}
                                  inputProps={{
                                    disabled: que?.FSQAttributes[0]?.max_current_datetime || que.language !== 'English',
                                    onChange: (e) => {
                                      return false;
                                    },
                                  }}
                                  initialValue={
                                    que?.FSQAttributes[0]?.max_time ? moment(que?.FSQAttributes[0]?.max_time, 'HH:mm') : ''
                                  }
                                  onChange={(ev) =>
                                    handleDateTime(ev, `FSQuestions.${qIndex}.FSQAttributes.0.max_time`, 'toTime')
                                  }
                                />
                                <img
                                  src={'/images/clock-icon.svg'}
                                  onClick={() => openDatepicker(`${que.response_type}${qIndex}to`)}
                                  className={`${styles.dateTimeIconImage}`}
                                ></img>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={`col-md-4 d-flex mt-1 ms-4 data-table`}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              disabled={que.language !== 'English'}
                              name={`FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                              checked={que.FSQAttributes[0]?.not_to_ans}
                              onChange={handleChange}
                              type="checkbox"
                              value=""
                              id="flexCheckDefault"
                            />
                          </div>
                          <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                        </div>
                      </div>
                    )}
                  </>
                </div>
              )}

              {/* question type inputs CDE Question */}
              {que.question_type === 'CDE Question' && (
                <>
                  <CDEQuestion
                    styles={styles}
                    handleChange={handleChange}
                    qIndex={qIndex}
                    que={que}
                    showErrors={showErrors}
                    CDEList={CDEList}
                    language={que.language}
                  />
                </>
              )}
            </div>
          ))}

        <div className="d-flex ps-0 mb-2">
          <div className="cursor-pointer mt-2" onClick={addQuestion}>
            <img
              className={`${styles.addTextIcon} me-2`}
              src={'/images/plus-icon.svg'}
              data-toggle="tooltip"
              title="Add Question"
            ></img>
            <span className={`${styles.defaultBoldText}`}>Add Question</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default EICFQuestionForm;
