import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import Validation from '../../../utils/validations';
import Select from 'react-select';
import moment from 'moment';

const CDEQuestion = ({ handleChange, styles, qIndex, index, que, showErrors, CDEList, language }) => {
  // console.log('language', language);
  // console.log('CDEList', CDEList);
  const [customCDEList, setCustomCDEList] = useState([]);
  // console.log('customCDEList', customCDEList);

  useEffect(() => {
    if (CDEList?.length) {
      let list = CDEList.find((list) => list.language == language) || { questions: [] };
      list = list.questions.map((cde) => {
        return {
          ...cde,
          linked_level: cde.linked_level || '',
          selected: cde.selected || false,
          label: cde.question || '',
          value: cde.variable_name || '',
        };
      });

      // let list = CDEList.map((cde) => {
      //   return {
      //     ...cde,
      //     linked_level: cde.English.linked_level,
      //     selected: cde.selected,
      //     label: cde[language].question,
      //     value: cde.variable_name,
      //   };
      // });
      // console.log('list=======================================', list);
      list = list.filter((cde) => cde?.linked_level == 0);
      setCustomCDEList(list);
    }
  }, [CDEList, language]);

  const getLabelAndValue = (list, value) => {
    if (list && list.length && value) {
      return list.find((que) => que.value === value);
    }
    return '';
  };

  const getOptions = (list) => {
    return list.filter((que) => !que.selected);
  };
  return (
    <div className="d-flex flex-column">
      {!que.linked_variable_name && (
        <>
          <Form.Group className="col me-5 my-2" controlId="selectCDEQuestion">
            {/* <Form.Select
            type="text"
            name={`FormsSections.${index}.FSQuestions.${qIndex}.cde_id`}
            placeholder=""
            onChange={handleChange}
            value={que[language].cde_id}
            className={`${styles.icfDropdown}`}
            aria-label="Default select CDE question"
            isInvalid={showErrors && Validation.empty(que[language].cde_id)}
            required>
            <option value="">-Select CDE Question-</option>
            {CDEList?.map((cdeQue, index) => (
              <option key={index} value={cdeQue.cde_id}>
                {cdeQue[`label${language}`]}{' '}
              </option>
            ))}
          </Form.Select> */}

            <Select
              hideSelectedOptions={true}
              value={getLabelAndValue(customCDEList, que.variable_name)}
              name={`FormsSections.${index}.FSQuestions.${qIndex}.variable_name`}
              onChange={(e) =>
                handleChange({
                  target: { value: e.value, name: `FormsSections.${index}.FSQuestions.${qIndex}.variable_name.cde_type` },
                })
              }
              options={getOptions(customCDEList)}
              isDisabled={que.language === 'Spanish'}
            />
            {showErrors && Validation.empty(que?.question) && (
              <span className={styles.cstInvalidFeedback}>Question is required field.</span>
            )}
          </Form.Group>
        </>
      )}
      {que.linked_variable_name && (
        <>
          {/* <div className={`${styles.sectionTitleFull} me-5 my-2 ps-2`}>
            <span>{que.question}</span>
          </div> */}
          <Form.Group className={`col me-5 mt-2 my-2 ${styles.contentshow}`} controlId="sectionQuestion">
            {que?.question_edited && <span className={styles.contentdata}>*</span>}
            <Form.Control
              type="text"
              name={`FormsSections.${index}.FSQuestions.${qIndex}.question`}
              placeholder="Question"
              onChange={handleChange}
              value={que.question}
              maxLength="150"
              isInvalid={showErrors && Validation.empty(que.question)}
              required
            />
            <Form.Control.Feedback type="invalid">Question is required field.</Form.Control.Feedback>
          </Form.Group>
        </>
      )}
      {que && (
        <>
          {/* <div className={`${styles.sectionTitleFull} me-5 mb-3 ps-2`}>
            <b>Hint - </b>
            <span>{que.hint}</span>
          </div> */}
          <Form.Group className="col me-5 mb-3" controlId="sectionHint">
            <Form.Control
              type="text"
              name={`FormsSections.${index}.FSQuestions.${qIndex}.hint`}
              placeholder="Hint"
              onChange={handleChange}
              value={que.hint}
              maxLength="150"
              // isInvalid={showErrors && Validation.empty(que.hint)}
              required
            />
            {/* <Form.Control.Feedback type="invalid">Hint is required field.</Form.Control.Feedback> */}
          </Form.Group>
          <div className="d-flex mb-2 ps-1">
            <div className={`${styles.defaultText} pe-5`}>
              <span>
                Variable Name: <b>{que.variable_name}</b>
              </span>
            </div>
            <div className={`${styles.defaultText} d-flex`}>
              <div>Response Type: </div>
              <div className={`${styles.sectionTitle} px-3`}>{que.response_type}</div>
            </div>
          </div>
          <div className={`${styles.hrLine} me-5 mb-3 ms-1`}></div>

          <div className={`col-md-6 ms-1 ${styles.cdeOptionsTable}`}>
            {['Radio Button', 'Multiple Choice', 'Dropdown'].includes(que.response_type) && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Options:</th>
                  <th>Values</th>
                </tr>
                {que.FSQAttributes.map((row, index) => (
                  <tr key={index}>
                    {/* <td>Choice {index + 1}</td> */}
                    <td>{row.choice_label}</td>
                    <td>{row?.choice_value}</td>
                  </tr>
                ))}
                <tr>
                  <td>Include prefer not to answer</td>
                  {que?.not_to_ans_value && <td>{que?.not_to_ans_value}</td>}
                  {!que?.not_to_ans_value && <td>{que?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>}
                </tr>
              </table>
            )}
            {que.response_type === 'Number' && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Attribute</th>
                  <th>Value</th>
                </tr>
                <tr>
                  {/* <td>1</td> */}
                  <td>Minimum Value Accepted</td>
                  <td>{Number(que?.FSQAttributes[0]?.num_min_value)}</td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Maximum Value Accepted</td>
                  <td>{Number(que?.FSQAttributes[0]?.num_max_value)}</td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Allowed Decimal Value</td>
                  <td>{Number(que?.FSQAttributes[0]?.num_flot_max)}</td>
                </tr>
                <tr>
                  {/* <td>4</td> */}
                  <td>Include prefer not to answer</td>
                  {que?.not_to_ans_value && <td>{que?.not_to_ans_value}</td>}
                  {!que?.not_to_ans_value && <td>{que?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>}
                </tr>
              </table>
            )}
            {que.response_type === 'Text Box' && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Attribute</th>
                  <th>Value</th>
                </tr>
                <tr>
                  {/* <td>1</td> */}
                  <td>Minimum Character Accepted</td>
                  <td>{que?.FSQAttributes[0]?.text_min_char}</td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Maximum Character Accepted</td>
                  <td>{que?.FSQAttributes[0]?.text_max_char}</td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
                </tr>
              </table>
            )}
            {que.response_type === 'Date' && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Attribute</th>
                  <th>Value</th>
                </tr>
                <tr>
                  {/* <td>1</td> */}
                  <td>Date From</td>
                  <td>
                    {moment(que?.FSQAttributes[0].min_date).isValid()
                      ? moment(que.FSQAttributes[0].min_date).format('MM/DD/YYYY')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Date To</td>
                  <td>
                    {moment(que?.FSQAttributes[0].max_date).isValid()
                      ? moment(que?.FSQAttributes[0].max_date).format('MM/DD/YYYY')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
                </tr>
              </table>
            )}
            {que.response_type === 'DateTime' && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Attribute</th>
                  <th>Value</th>
                </tr>
                <tr>
                  {/* <td>1</td> */}
                  <td>Date Time From</td>
                  <td>
                    {moment(que?.FSQAttributes[0].min_datetime).isValid()
                      ? moment(que?.FSQAttributes[0].min_datetime).format('MM/DD/YYYY;HH:mm')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Date Time To</td>
                  <td>
                    {moment(que?.FSQAttributes[0].max_datetime).isValid()
                      ? moment(que?.FSQAttributes[0].max_datetime).format('MM/DD/YYYY;HH:mm')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
                </tr>
              </table>
            )}
            {que.response_type === 'Time' && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Attribute</th>
                  <th>Value</th>
                </tr>
                <tr>
                  {/* <td>1</td> */}
                  <td> Time From</td>
                  <td>
                    {que?.FSQAttributes[0]?.min_time}
                    {/* {que?.FSQAttributes[0]?.min_time
                      ? moment(que?.FSQAttributes[0].min_time, 'HH:mm')
                      : ''} */}
                  </td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td> Time To</td>
                  <td>
                    {que?.FSQAttributes[0]?.max_time}
                    {/* {que?.FSQAttributes[0]?.max_time
                      ? moment(que?.FSQAttributes[0].max_time, 'HH:mm')
                      : ''} */}
                  </td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
                </tr>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CDEQuestion;
