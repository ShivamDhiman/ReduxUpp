import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Spinner, Table } from 'react-bootstrap';
import API from '../../helpers/api';
import moment from 'moment';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { decodeData, encodeData } from '../../helpers/auth';

const initialState = {
  assignee: '',
  first_name: '',
  id: '',
  last_name: '',
  mobile_phone: '',
  consented_at: '',
  participant_id: '',
  personal_email: '',
  formData: [],
  arms: '',
  currentFormArm: '',
  is_anonymous_user: '',
};
const PreviewModal = (props) => {
  const { styles } = props;
  const [participant, setParticipant] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const previewdata = decodeData(props?.participant_id);
  const {
    assignee,
    first_name,
    id,
    last_name,
    mobile_phone,
    participant_id,
    personal_email,
    formData,
    arms,
    currentFormArm,
    consented_at,
    is_anonymous_user,
  } = participant;
  const router = useRouter();
  const redirectParticipant = () => {
    const {
      first_name,
      last_name,
      personal_email,
      mobile_phone,
      assignee: assigneeDetail,
      participant_id,
      form_code,
      form_name,
      id,
      sendEmailNow,
    } = previewdata;

    const payload = {
      first_name,
      last_name,
      personal_email,
      mobile_phone,
      participant_id,
      assignee: assigneeDetail || assignee?.id,
      form_code,
      form_name,
      // survey_status,
      id,
      sendEmailNow,
      formList: formData,
      arms: currentFormArm,
      is_anonymous_user: is_anonymous_user,
    };

    const encoded = encodeData(payload);
    router.push(`/participant-management/?redirect=${encoded}`);
  };

  useEffect(() => {
    if (previewdata?.id) {
      getUserDetails();
    }
  }, [props]);

  const getUserDetails = () => {
    API.apiGet(
      'participantDetails',
      `?id=${previewdata?.id}&form_code=${previewdata?.form_code}&form_group=${previewdata?.form_group}`
    )
      .then((response) => {
        if (response.data && response.data.status === true && response.data.data) {
          const { formData, assigneeInfo, arm } = response.data.data;
          let allArms = formData?.map((form) => form.arm_name);
          let currentArm = formData?.find((form) => form.form_code === previewdata.form_code);
          setParticipant({
            ...response.data.data,
            assignee: assigneeInfo,
            arms: arm || allArms,
            currentFormArm: arm, // { id: currentArm?.arm_id, name: currentArm?.arm_name },
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        setLoading(false);
      });
  };

  return (
    <>
      <div className="d-flex justify-content-between mb-4">
        <div className={`mt-auto ${styles.previewMainHeader}`}>View participant Details</div>
        <div>
          <Button className="admin_panel_button primary" variant="secondary" size="md" onClick={redirectParticipant}>
            Edit
          </Button>
          <Button
            className={`mx-2 admin_panel_button primary ${styles.btnblack}`}
            size="md"
            onClick={() => {
              router.push('/participant-management/');
            }}
          >
            Close
          </Button>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-8">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className={styles.textlabal}>First Name</div>
              <div className={styles.contentText}>{first_name}</div>
            </div>
            <div className="col-md-6">
              <div className={styles.textlabal}>Last Name</div>
              <div className={styles.contentText}>{last_name}</div>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className={styles.textlabal}>Participant ID</div>
              <div className={styles.contentText}>{participant_id}</div>
            </div>
            <div className="col-md-6">
              <div className={styles.textlabal}>Assign Person</div>
              <div className={styles.contentText}>{`${assignee?.first_name || ''} ${assignee?.last_name || ''}`}</div>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className={styles.textlabal}>Email</div>
              <div className={`${styles.contentText} text-break`}>{personal_email}</div>
            </div>
            <div className="col-md-6">
              <div className={styles.textlabal}>Contact No.</div>
              <div className={styles.contentText}>{mobile_phone}</div>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className={styles.textlabal}>Arm</div>
              <div className={styles.contentText}>{currentFormArm?.name || arms?.name}</div>
            </div>
            <div className="col-md-6">
              <div className={styles.textlabal}>Last Consented Date:</div>
              <div className={styles.contentText}>{consented_at ? moment(consented_at).format('MM-DD-YYYY h:mm') : '-'}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={`mb-1 mt-3 ${styles.tableDetails}`}>Details:</div>
      <div className="table-responsive text-center">
        <Table hover className="data-table">
          <thead>
            <tr>
              <th className="ps-3">Sr. No.</th>
              <th>Form Name</th>
              <th>Sent</th>
              <th>Started</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {formData?.map((row, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="text-break">{row?.form_name || '-'}</td>
                <td>{row?.form_send_date ? moment(row?.form_send_date).format('MM-DD-YY h:mm') : '-'}</td>
                <td>{row?.initiated_at ? moment(row?.initiated_at).format('MM-DD-YY h:mm') : '-'}</td>
                <td>{row?.completed_at ? moment(row?.completed_at).format('MM-DD-YY h:mm') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && !formData?.length && <div className="d-flex justify-content-center">No Records Found.</div>}
        {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
      </div>
    </>
  );
};

export default PreviewModal;
