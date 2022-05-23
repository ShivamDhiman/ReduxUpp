import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import Validation from '../../../utils/validations';
import Select from 'react-select';
import moment from 'moment';

const CDEQuestion = ({ handleChange, styles, qIndex, index, que, showErrors, CDEList, language }) => {
  const [customCDEList, setCustomCDEList] = useState([]);

  useEffect(() => {
    if (CDEList?.length) {
      let list = CDEList.map((cde) => {
        return {
          ...cde,
          linked_level: cde.English.linked_level,
          selected: cde.selected,
          label: cde[language].question,
          value: cde.variable_name,
        };
      });
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
      {que[language] && !que[language].linked_variable_name && (
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
            value={getLabelAndValue(customCDEList, que[language].variable_name)}
            name={`FormsSections.${index}.FSQuestions.${qIndex}.variable_name`}
            onChange={(e) =>
              handleChange({
                target: { value: e.value, name: `FormsSections.${index}.FSQuestions.${qIndex}.variable_name` },
              })
            }
            options={getOptions(customCDEList)}
            isDisabled={que.language === 'Spanish'}
          />
          <Form.Control.Feedback type="invalid">Required Field!</Form.Control.Feedback>
        </Form.Group>
      )}
      {que[language] && que[language].linked_variable_name && (
        <div className={`${styles.sectionTitleFull} me-5 my-2 ps-2`}>
          <span>{que[language].question}</span>
        </div>
      )}
      {que[language] && (
        <>
          <div className={`${styles.sectionTitleFull} me-5 mb-3 ps-2`}>
            <b>Hint - </b>
            <span>{que[language].hint}</span>
          </div>
          <div className="d-flex mb-2 ps-1">
            <div className={`${styles.defaultText} pe-5`}>
              <span>
                Variable Name: <b>{que[language].variable_name}</b>
              </span>
            </div>
            <div className={`${styles.defaultText} d-flex`}>
              <div>Response Type: </div>
              <div className={`${styles.sectionTitle} px-3`}>{que[language].response_type}</div>
            </div>
          </div>
          <div className={`${styles.hrLine} me-5 mb-3 ms-1`}></div>

          <div className={`col-md-6 ms-1 ${styles.cdeOptionsTable}`}>
            {['Radio Button', 'Multiple Choice', 'Dropdown'].includes(que[language].response_type) && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Options:</th>
                  <th>Values</th>
                </tr>
                {que[language].FSQAttributes.map((row, index) => (
                  <tr key={index}>
                    {/* <td>Choice {index + 1}</td> */}
                    <td>{row.choice_label}</td>
                    <td>{row?.choice_value}</td>
                  </tr>
                ))}
                <tr>
                  <td>Include prefer not to answer</td>
                  {que[language]?.not_to_ans_value && <td>{que[language]?.not_to_ans_value}</td>}
                  {!que[language]?.not_to_ans_value && <td>{que[language]?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>}
                </tr>
              </table>
            )}
            {que[language].response_type === 'Number' && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Attribute</th>
                  <th>Value</th>
                </tr>
                <tr>
                  {/* <td>1</td> */}
                  <td>Minimum Value Accepted</td>
                  <td>{que[language]?.FSQAttributes[0]?.num_min_value}</td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Maximum Value Accepted</td>
                  <td>{que[language]?.FSQAttributes[0]?.num_max_value}</td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Allowed Decimal Value</td>
                  <td>{que[language]?.FSQAttributes[0]?.num_flot_max}</td>
                </tr>
                <tr>
                  {/* <td>4</td> */}
                  <td>Include prefer not to answer</td>
                  {que[language]?.not_to_ans_value && <td>{que[language]?.not_to_ans_value}</td>}
                  {!que[language]?.not_to_ans_value && <td>{que[language]?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>}
                </tr>
              </table>
            )}
            {que[language].response_type === 'Text Box' && (
              <table>
                <tr>
                  {/* <th>Sl.No</th> */}
                  <th>Attribute</th>
                  <th>Value</th>
                </tr>
                <tr>
                  {/* <td>1</td> */}
                  <td>Minimum Character Accepted</td>
                  <td>{que[language]?.FSQAttributes[0]?.text_min_char}</td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Maximum Character Accepted</td>
                  <td>{que[language]?.FSQAttributes[0]?.text_max_char}</td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que[language]?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
                </tr>
              </table>
            )}
            {que[language].response_type === 'Date' && (
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
                    {moment(que[language]?.FSQAttributes[0].min_date).isValid()
                      ? moment(que[language].FSQAttributes[0].min_date).format('MM/DD/YYYY')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Date To</td>
                  <td>
                    {moment(que[language]?.FSQAttributes[0].max_date).isValid()
                      ? moment(que[language]?.FSQAttributes[0].max_date).format('MM/DD/YYYY')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que[language]?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
                </tr>
              </table>
            )}
            {que[language].response_type === 'DateTime' && (
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
                    {moment(que[language]?.FSQAttributes[0].min_datetime).isValid()
                      ? moment(que[language]?.FSQAttributes[0].min_datetime).format('MM/DD/YYYY;HH:mm')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td>Date Time To</td>
                  <td>
                    {moment(que[language]?.FSQAttributes[0].max_datetime).isValid()
                      ? moment(que[language]?.FSQAttributes[0].max_datetime).format('MM/DD/YYYY;HH:mm')
                      : '-'}
                  </td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que[language]?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
                </tr>
              </table>
            )}
            {que[language].response_type === 'Time' && (
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
                    {que[language]?.FSQAttributes[0]?.min_time}
                    {/* {que[language]?.FSQAttributes[0]?.min_time
                      ? moment(que[language]?.FSQAttributes[0].min_time, 'HH:mm')
                      : ''} */}
                  </td>
                </tr>
                <tr>
                  {/* <td>2</td> */}
                  <td> Time To</td>
                  <td>
                    {que[language]?.FSQAttributes[0]?.max_time}
                    {/* {que[language]?.FSQAttributes[0]?.max_time
                      ? moment(que[language]?.FSQAttributes[0].max_time, 'HH:mm')
                      : ''} */}
                  </td>
                </tr>
                <tr>
                  {/* <td>3</td> */}
                  <td>Include prefer not to answer</td>
                  <td>{que[language]?.FSQAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
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
