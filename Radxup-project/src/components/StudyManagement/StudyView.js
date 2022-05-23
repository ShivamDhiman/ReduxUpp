import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import router from 'next/router';
import { encodeData } from '../../helpers/auth';
import { useEffect, useState } from 'react';
import CDEtoCollect from './CDEtoCollect';
import CDEtoShareComponent from './CDEtoShare';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import ConfirmationModal from '../common/confirmationModal';

const StudyView = (props) => {
  const { styles, study, documents, cancel, collectedCDES } = props;
  const [loading, setLoading] = useState(false);
  const [mandatoryCDEModal, setMandatoryCDEModal] = useState(false);
  const [shareCDEModal, setShareCDEModal] = useState(false);
  const [studyStatus, setStudyStatus] = useState('All');
  const { id, study_id, name, awardee_org, admins, participants, records_pushed, description, cdeList, status, summary } =
    study;
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});

  const handleStudyStatus = (e) => {
    setStudyStatus(e.target.value);
  };
  const handleEdit = () => {
    let encryptedPayload = encodeData({ id });
    router.push({
      pathname: '/study-management/edit',
      query: { search: encryptedPayload },
    });
  };

  useEffect(() => {
    if (Object.keys(study).length && cdeList?.length) {
      let requiredCount = 0;
      let cdeToShareCount = 0;
      cdeList.forEach((section) => {
        requiredCount = requiredCount + section.StudyCDEQuestions.length;
        cdeToShareCount = cdeToShareCount + section.StudyCDEQuestions.filter((que) => que.shared_question)?.length;
      });
    }
    setStudyStatus(study?.status);
  }, [study]);

  const openModal = (name) => {
    if (name == 'MANDATORY' && summary?.CDEsToCollect !== 0) {
      setMandatoryCDEModal(true);
    } else if (name == 'SHARED' && summary?.CDEsToShare !== 0) {
      setShareCDEModal(true);
    } else {
      toast.error('CDE questions not attached.');
    }
  };

  const onSave = () => {
    setLoading(true);
    const payload = encodeData({ id: study.id, status: studyStatus });
    API.apiPost('studyStatusUpdate', { payload: payload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          toast.success('Study successfully updated ');
          router.push('/study-management');
          setLoading(false);
          setShowModal(false);
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
      });
  };

  const onSaveFunction = () => {
    if (studyStatus !== study.status) {
      let actionType = 'save';
      setPayloadData({
        actionType,
      });
      setShowModal(true);
    }
    if (studyStatus === study.status) {
      cancel();
    }
  };
  const onHandleCloseAction = (data) => {
    if (data.actionType === 'save') {
      onSave();
    }
    setShowModal(false);
  };

  const admin_netIds = admins?.map((admin) => admin?.personal_email);
  return (
    <>
      {ShowModal && <ConfirmationModal open={ShowModal} handleClose={onHandleCloseAction} data={payloadData} />}
      <Modal
        className="custom-modal"
        show={shareCDEModal}
        onHide={() => setShareCDEModal(false)}
        backdrop="static"
        keyboard={false}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="modal-header pb-0" onHide={() => setShareCDEModal(false)}>
          <Modal.Title className="title fw-bold">{'Mandatory Tier 1 CDEs to share:'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CDEtoShareComponent collectedCDES={collectedCDES} styles={styles} study={study} isModalView={true} />
        </Modal.Body>
      </Modal>

      <Modal
        className="custom-modal"
        show={mandatoryCDEModal}
        onHide={() => setMandatoryCDEModal(false)}
        backdrop="static"
        size="xl"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton className="modal-header pb-0" onHide={() => setMandatoryCDEModal(false)}>
          <Modal.Title className="title fw-bold">{'Mandatory Tier 1 CDEs to collect:'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CDEtoCollect collectedCDES={collectedCDES} styles={styles} study={study} isModalView={true} />
        </Modal.Body>
      </Modal>

      <div className="d-flex justify-content-between">
        <div className={`mt-auto ${styles.studyViewMainHeader}`}>View Study Details</div>
        <div>
          <Button
            size="md"
            className="admin_panel_button primary"
            disabled={['all', 'completed'].includes(status?.toLowerCase())}
            onClick={handleEdit}
          >
            Edit
          </Button>
        </div>
      </div>
      <div className="mt-3 d-flex justify-content-start">
        <Form.Group>
          <Form.Label>Status</Form.Label>
          <Form.Select
            aria-label="Default select example"
            value={studyStatus}
            className="custom_select"
            onChange={handleStudyStatus}
          >
            <option hidden>Select Status</option>
            {/* <option value="all">All</option> */}
            <option value="Live">Live</option>
            {/* <option value="active">Active</option> */}
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
            <option value="Onboarding">Onboarding</option>
          </Form.Select>
        </Form.Group>
      </div>
      <div className="d-flex  mt-4">
        <div className="d-flex col-4 flex-column">
          <div className={`${styles.studyViewHeader}`}>Study Id:</div>
          <div className={`${styles.studyViewLabel} text-break`}>{study_id || '--'}</div>
        </div>
        <div className="d-flex col-8 flex-column ms-4">
          <div className={`${styles.studyViewHeader}`}>Awardee Organization:</div>
          <div className={`${styles.studyViewLabel} text-break`}>{awardee_org || '--'}</div>
        </div>
      </div>
      <div className="d-flex  mt-4">
        <div className="d-flex col-4 flex-column">
          <div className={`${styles.studyViewHeader}`}>Study Name:</div>
          <div className={`${styles.studyViewLabel} text-break`}>{name || '--'}</div>
        </div>
        <div className="d-flex col-8 flex-column ms-4">
          <div className={`${styles.studyViewHeader}`}>Study Admin Incommon Net ID:</div>
          <div className={`${styles.studyViewLabel} text-break`}>
            {admin_netIds?.map((email) => (
              <span className="me-2">{email}</span>
            ))}
            {!admin_netIds?.length && '--'}
          </div>
        </div>
      </div>
      <div className="d-flex  mt-4">
        <div className="d-flex col-4 flex-column">
          <div className={`${styles.studyViewHeader}`}>Number of Participants Enrolled:</div>
          <div className={`${styles.studyViewLabel} text-break`}>{participants || '--'}</div>
        </div>
        <div className="d-flex col-8 flex-column ms-4">
          <div className={`${styles.studyViewHeader}`}>Number of Records Pushed:</div>
          <div className={`${styles.studyViewLabel} text-break`}>{records_pushed || '--'}</div>
        </div>
      </div>
      <div className="d-flex  mt-4">
        <div className="d-flex col-12 flex-column">
          <div className={`${styles.studyViewHeader}`}>Study Description:</div>
          <div className={`${styles.studyViewDescription} text-break`}>{description || '--'}</div>
        </div>
      </div>
      <div className="d-flex  mt-4">
        <div className="d-flex col-3 flex-column">
          <div className={`${styles.studyViewHeader}`}>Study Arm:</div>
        </div>
        <div className="d-flex col-3 flex-column">
          <div className={`${styles.studyViewHeader} `}>Arm Description:</div>
        </div>
      </div>
      {study?.arms?.map((arm) => (
        <div className="d-flex mt-1 mb-5">
          <div className="d-flex col-3 flex-column text-wrap">
            <div className={`${styles.studyViewLabel} pe-2`}>{arm.name || '--'}</div>
          </div>
          <div className="d-flex col-9 flex-column">
            <div className={`${styles.studyViewDescription} text-wrap`}>{arm.description || '--'}</div>
          </div>
        </div>
      ))}
      <div className="d-flex mt-4">
        <div className={`card mt-3 me-5 ${styles.documentCard}`}>
          <div className="d-flex justify-content-between align-items-center py-3 px-2 ">
            <div className="d-flex flex-column">
              <div className={`${styles.studyViewHeader}`}>Mandatory Tier 1 CDEs to collect:</div>
              <div className={`flex-grow-1  ${styles.studyViewLabel}`}>{summary?.CDEsToCollect}</div>
            </div>

            <div className={`${styles.studyViewCardIcon}`} name="MANDATORY" onClick={() => openModal('MANDATORY')}>
              <img
                src={'/images/eye.svg'}
                data-toggle="tooltip"
                title="Mandatory Tier 1 CDEs to collect "
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div className={`card mt-3 ms-5 ${styles.documentCard}`}>
          <div className="d-flex justify-content-between align-items-center py-3 px-2 ">
            <div className="d-flex flex-column">
              <div className={`${styles.studyViewHeader}`}>Mandatory Tier 1 CDEs to share:</div>
              <div className={`flex-grow-1  ${styles.studyViewLabel}`}> {summary?.CDEsToShare}</div>
            </div>
            <div className={`${styles.studyViewCardIcon}`} name="SHARED" onClick={() => openModal('SHARED')}>
              <img
                src={'/images/eye.svg'}
                data-toggle="tooltip"
                title="Mandatory Tier 1 CDEs to share"
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex mt-4">
        <div className={`${styles.studyViewHeader}`}>Documents</div>
      </div>
      <div className="d-flex justify-content-start">
        {documents?.map((doc, index) => (
          <div key={index} className={`d-flex flex-column mx-2 px-1 ${styles.contentBorder}`}>
            <div className={`me-2 ${styles.studyViewLabel}`}>{doc.document_type}:</div>
            <div className={`${styles.documentDocs} mt-2`}>
              {!!doc.document?.length
                ? doc.document.map((file, i) => (
                    <div data-toggle="tooltip" title={file?.document_name}>
                      <span className="text-break">
                        {i + 1}.&nbsp;{' '}
                        {file.document_name.length > 32
                          ? file.document_name.substring(0, 32).trim() + '...'
                          : file.document_name}
                      </span>
                      <img
                        src={`/images/${file.status !== 'pending' ? 'radio.svg' : 'pending.svg'}`}
                        className="cursor-pointer ms-1 mb-1"
                        data-toggle="tooltip"
                        title="Upload"
                      />
                    </div>
                  ))
                : '--'}
            </div>
          </div>
        ))}
      </div>
      <div className="d-flex mt-5 mb-5 justify-content-end">
        <div className={` fw-bold ms-3 ${styles.sectionHeading}`}>
          <Button size="md" className="admin_panel_button primary" onClick={() => cancel()}>
            Cancel
          </Button>
        </div>
        <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
          <Button size="md" disabled={loading} onClick={onSaveFunction} className="admin_panel_button secondary">
            Save
            {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default StudyView;
