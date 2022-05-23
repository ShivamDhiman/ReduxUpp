import { Dropdown } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import moment from 'moment';
import styles from '../../stylesheets/Forms.module.scss';
import { encodeData, isAuth } from '../../helpers/auth';
import { useRouter } from 'next/router';
import ConfirmationModal from '../common/confirmationModal';
import { setForms } from '../../store/actions/forms';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { useDispatch } from 'react-redux';
import { setCDEQuestions } from '../../store/actions/CDEQuestions';
import { setCDESummary } from '../../store/actions/CDEQuestions';

export default function FormCard(props) {
  const {
    name,
    version,
    language,
    languageList,
    form_expire,
    form_expire_time,
    updated_at,
    updated_by,
    status,
    category,
    form_code,
    form_name,
    id,
    form_group,
  } = props;
  console.log(props);
  const router = useRouter();
  const dispatch = useDispatch();
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});
  const [loadingForModal, setLoadingForModal] = useState(false);
  const editFormData = (isNewVersion) => {
    const encodeToken = encodeData({
      name,
      version,
      language,
      status,
      preview: false,
      createVersion: isNewVersion,
      category,
      form_group,
    });
    router.push(`/forms/${encodeToken}`);
  };

  const perviewFormData = () => {
    const encodeToken = encodeData({ name, version, language, status, preview: true, category });
    router.push(`/forms/${encodeToken}`);
  };

  const confirmAction = (status, actionType) => {
    setPayloadData({
      actionType,
      version,
      name,
      status,
      module: 'form',
    });
    setShowModal(true);
  };

  const onHandleCloseAction = (data) => {
    let user = isAuth();
    if (!data) {
      setShowModal(false);
      return;
    }
    const { actionType, name, version } = data;
    setLoadingForModal(true);
    if (actionType === 'delete') {
      let payload = { name, version };
      const encodePayload = encodeData(payload);
      API.apiPost('deleteForm', { payload: encodePayload })
        .then((response) => {
          if (response.data && response.data.success === true) {
            setShowModal(false);
            setLoadingForModal(false);
            toast.success(response.data.message);
            dispatch(setForms());
          }
        })
        .catch((err) => {
          console.log('err', err);
          handleErrorMessage(err);
          setLoadingForModal(false);
        });
    }
    if (actionType === 'archive') {
      setLoadingForModal(true);
      let payload = { name, version, status: 'Archive' };
      const encodePayload = encodeData(payload);
      API.apiPost('formUpdateStatus', { payload: encodePayload })
        .then((response) => {
          if (response.data && response.data.success === true) {
            setShowModal(false);
            setLoadingForModal(false);
            // update count cde
            dispatch(setCDESummary(user?.study_id));
            toast.success(response.data.message);
            dispatch(setForms());
          }
        })
        .catch((err) => {
          console.log('err', err);
          handleErrorMessage(err);
          setLoadingForModal(false);
        });
    }
  };

  const onCopyLink = () => {
    const inhoursMintues = `${form_expire_time * 24}:00`;
    const basePath = window.location.origin;
    const [hourTime, minTime] = inhoursMintues?.split(':');

    const hour = form_expire && hourTime ? parseInt(hourTime) : 0;
    const min = form_expire && minTime ? parseInt(minTime) : 0;

    let expiryDate = moment().unix();
    if (form_expire) {
      expiryDate = moment().add(hour, 'hours').add(min, 'minutes').unix();
    } else {
      expiryDate = moment('2099-12-31').unix();
    }

    const user = isAuth();
    const tokenInfo = {
      form_id: id,
      form_code: form_code,
      form_name: name,
      version: version,
      linkExp: expiryDate,
      study_id: user.study_id,
      form_group: form_group,
    };
    const link = basePath + `/e-consent?query=${encodeData(tokenInfo)}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="row p-2">
      {ShowModal && (
        <ConfirmationModal open={ShowModal} handleClose={onHandleCloseAction} data={payloadData} loading={loadingForModal} />
      )}
      <div className={`card col-md-12  ${styles.formMgmtCard}  ${styles[status]}`}>
        <div className="row ">
          <div className="col-md-4 d-flex align-items-start flex-column py-2">
            <label className={`${styles.formName}`}>{name}</label>
            <label className={`${styles.version}`}>{'Version ' + version}</label>
          </div>
          <div className={`col-md-6 d-flex align-items-center justify-content-between py-2 ${styles.subInfo}`}>
            <div className=" d-flex align-items-start flex-column col-md-3 ">
              <label className={`${styles.formName} my-1`}>Form Type</label>
              <label className={`${styles.version} my-1`}>{category}</label>
            </div>
            <div className=" d-flex align-items-start flex-column col-md-3 ">
              <label className={`${styles.formName} my-1`}>Language</label>
              <label className={`${styles.version} my-1`}>{languageList}</label>
            </div>
            <div className=" d-flex align-items-start flex-column col-md-3">
              {status === 'Draft' && <label className={`${styles.formName} my-1`}>Updated by </label>}
              {status === 'Archive' && <label className={`${styles.formName} my-1`}>Archived by </label>}
              {status === 'Published' && <label className={`${styles.formName} my-1`}>Published by </label>}

              <label className={`${styles.version} my-1`}>
                {updated_by?.first_name + ' ' + updated_by?.last_name}{' '}
                {!updated_by?.last_name && !updated_by?.first_name ? '-' : ''}
              </label>
            </div>
            <div className=" d-flex align-items-start flex-column col-md-3">
              <label className={`${styles.formName} my-1`}>
                {status === 'Archive' ? 'Archived on ' : status === 'Published' ? 'Published on' : 'Last Updated On'}
              </label>
              <label className={`${styles.version} my-1`}>
                <img src={'/images/calendar.svg'} className="pe-2 " />
                {moment(updated_at).format('MM-DD-YYYY')}
              </label>
            </div>
            <div className={` ${styles.actions} d-flex justify-content-around col-md-3`}>
              {status == 'Draft' && (
                <>
                  <img
                    src={'/images/edit.svg'}
                    data-toggle="tooltip"
                    title="Edit"
                    className="cursor-pointer mx-4"
                    onClick={() => editFormData(false)}
                  />
                  <img
                    src={'/images/trash.svg'}
                    data-toggle="tooltip"
                    title="Delete"
                    className="cursor-pointer mx-4"
                    onClick={() => confirmAction(status, 'delete')}
                  />
                </>
              )}
              {status == 'Published' && (
                <>
                  <img src={'/images/eye.svg'} className="cursor-pointer px-4 " onClick={perviewFormData} />
                  <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic" className={`bg-white border-0 p-0 ${styles.toggleButton}`}>
                      <img src={'/images/three-dot-icon.svg'} className="cursor-pointer mb-1 " />
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => onCopyLink()} className={styles.menuItems}>
                        Copy Link
                      </Dropdown.Item>
                      <Dropdown.Item className={styles.menuItems} onClick={() => confirmAction(status, 'archive')}>
                        Archive
                      </Dropdown.Item>
                      <Dropdown.Item className={styles.menuItems} onClick={() => editFormData('newVersion')}>
                        Create New Version
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              )}
              {status == 'Archive' && (
                <>
                  <img src={'/images/eye.svg'} className="cursor-pointer px-4 " onClick={perviewFormData} />
                  {/* <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic" className={`bg-white border-0 p-0 ${styles.toggleButton}`}>
                      <img src={'/images/three-dot-icon.svg'} className="cursor-pointer mb-1 " />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item className={styles.menuItems} onClick={() => editFormData('newVersion')}>
                        Create New Version
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown> */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
