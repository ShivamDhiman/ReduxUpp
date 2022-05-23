import moment from 'moment';

const QuestionAttributes = (props) => {
  const { styles, question } = props;
  const { response_type, CDEQuestionsAttributes } = question;
  return (
    <>
      {['Radio Button', 'Multiple Choice', 'Dropdown'].includes(response_type) && (
        <table className={styles.dataTable}>
          <tr>
            <th>Sl.No</th>
            <th>Options:</th>
            <th>Values</th>
          </tr>
          {CDEQuestionsAttributes?.map((item, index) => {
            return (
              <tr>
                <td>{index + 1}</td>
                <td>{item?.choice_label}</td>
                <td>{item?.choice_value}</td>
              </tr>
            );
          })}
          {/* <tr>
            <td>{CDEQuestionsAttributes?.length}</td>
            <td>Include prefer not to answer</td>
            <td>{CDEQuestionsAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
          </tr> */}
        </table>
      )}
      {response_type === 'Number' && (
        <table className={styles.dataTable}>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Minimum Value Accepted</td>
            <td>{CDEQuestionsAttributes[0]?.num_min_value}</td>
          </tr>
          <tr>
            <td>Maximum Value Accepted</td>
            <td>{CDEQuestionsAttributes[0]?.num_max_value}</td>
          </tr>
          <tr>
            <td>Allowed Decimal Value</td>
            <td>{CDEQuestionsAttributes[0]?.num_flot_max}</td>
          </tr>
          {/* <tr>
            <td>Include prefer not to answer</td>
            <td>{CDEQuestionsAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
          </tr> */}
        </table>
      )}
      {response_type === 'Text Box' && (
        <table className={styles.dataTable}>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Minimum Character Accepted</td>
            <td>{CDEQuestionsAttributes[0]?.text_min_char}</td>
          </tr>
          <tr>
            <td>Maximum Character Accepted</td>
            <td>{CDEQuestionsAttributes[0]?.text_max_char}</td>
          </tr>
          {/* <tr>
            <td>Include prefer not to answer</td>
            <td>{CDEQuestionsAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
          </tr> */}
        </table>
      )}
      {response_type === 'Date' && (
        <table className={styles.dataTable}>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Date From</td>
            <td>
              {moment(CDEQuestionsAttributes[0].min_date).isValid()
                ? moment(CDEQuestionsAttributes[0].min_date).format('MM/DD/YYYY')
                : '-'}
            </td>
          </tr>
          <tr>
            <td>Date To</td>
            <td>
              {moment(CDEQuestionsAttributes[0].max_date).isValid()
                ? moment(CDEQuestionsAttributes[0].max_date).format('MM/DD/YYYY')
                : '-'}
            </td>
          </tr>
          {/* <tr>
            <td>Include prefer not to answer</td>
            <td>{CDEQuestionsAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
          </tr> */}
        </table>
      )}
      {response_type === 'DateTime' && (
        <table className={styles.dataTable}>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Date Time From</td>
            <td>
              {moment(CDEQuestionsAttributes[0].min_datetime).isValid()
                ? moment(CDEQuestionsAttributes[0].min_datetime).format('MM/DD/YYYY;HH:mm')
                : '-'}
            </td>
          </tr>
          <tr>
            <td>Date Time To</td>
            <td>
              {moment(CDEQuestionsAttributes[0].max_datetime).isValid()
                ? moment(CDEQuestionsAttributes[0].max_datetime).format('MM/DD/YYYY;HH:mm')
                : '-'}
            </td>
          </tr>
          {/* <tr>
             <td>Include prefer not to answer</td>
            <td>{CDEQuestionsAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
          </tr> */}
        </table>
      )}
      {response_type === 'Time' && (
        <table className={styles.dataTable}>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
          <tr>
            <td> Time From</td>
            <td>{CDEQuestionsAttributes[0]?.min_time}</td>
          </tr>
          <tr>
            <td> Time To</td>
            <td>{CDEQuestionsAttributes[0]?.max_time}</td>
          </tr>
          {/* <tr>
            <td>Include prefer not to answer</td>
            <td>{CDEQuestionsAttributes[0]?.not_to_ans ? 'Yes' : 'No'}</td>
          </tr> */}
        </table>
      )}
    </>
  );
};

export default QuestionAttributes;
