import { useRef, useState } from 'react';
import { Modal, Button, FormGroup, Form } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { encodeData } from '../../helpers/auth';
import { fetchFormData } from '../../store/actions/survey';

const initialState = () => ({
  form_name: '',
  form_code: '',
  form_id: '',
  study_id: '',
  participant_id: '',
});

const ExportModal = ({ handleClose, formLists }) => {
  const [data, setData] = useState(initialState());
  const csvRef = useRef();
  const [heads, setHeads] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const dispatch = useDispatch();

  const exportData = () => {
    const { form_name='' } = data;
    const currentDate = moment(new Date()).format('MM/DD/YYYY');
    setFileName(`${form_name}_${currentDate}`);

    if(!data.form_code) {
      setShowErrors(true);
      return;
    }
    // handleClose();
    const payload = {
      form_code: data.form_code,
      form_group: data.form_group,
    };
    const encodePayload = encodeData(payload);
    dispatch(fetchFormData(encodePayload)).then((list) => {
      if (Array.isArray(list) && list.length) {
        let headers = list.reduce((acc, obj) => {
          let newObj = { ...acc };
          Object.keys(obj).forEach((key) => {
            newObj[key] = true;
          });
          return newObj;
        }, {});
        headers = Object.keys(headers).map((item) => ({
          label: item?.toUpperCase(),
          key: item,
        }));
        setHeads(headers);
        setCsvData(list);
        csvRef?.current?.click();
      }
    });
  };

  const onChangeHandler = (e) => {
    if (e.target.name === 'form_code') {
      const obj = formLists.find((item) => item.form_code === e.target.value) || {};
      setData({
        form_code: obj?.form_code,
        form_name: obj?.name,
        form_id: obj?.id,
        study_id: obj?.study_id,
        participant_id: obj?.participant_id,
      });
    }
  };

  return (
    <>
      {heads && heads.length ? (
        <CSVLink headers={heads} filename={`${fileName}.csv`} data={csvData}>
          <button ref={csvRef} className="d-none"></button>
        </CSVLink>
      ) : null}
      <Modal.Header closeButton className="modal-header pb-0">
        <Modal.Title className="title fw-bold">Export Form Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FormGroup>
          <label className="form-label text-dark fw-bold">Form</label>
          <Form.Select
            value={data && data.form_code}
            name="form_code"
            className="form-select"
            aria-label="Default select form"
            onChange={onChangeHandler}
            isInvalid={showErrors && !data?.form_code}
          >
            <option hidden>Please select Form</option>
            {formLists.map((item, i) => (
              <option key={i} value={item.form_code}>
                {item.name}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
             Please select one from the list.
          </Form.Control.Feedback>
        </FormGroup>
      </Modal.Body>
      <Modal.Footer className="modal-footer">
        <Button variant="secondary" size="md" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={exportData}>
          Export
        </Button>
      </Modal.Footer>
    </>
  );
};
export default ExportModal;

ExportModal.defaultProps = {
  formLists: [],
};
