import dynamic from 'next/dynamic';
import { InputGroup, Modal, Button, Form } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import styles from '../../stylesheets/InitiateParticipant.module.scss';
import { WithAuth } from '../common/WithAuth';
import { useSelector, useDispatch } from 'react-redux';
import { setFormLists, setParticipants, setMangersLists } from '../../store/actions/participants';
import ParticipantModal from '../ParticipantManagement/ParticipantModal';
import { decodeData, encodeData, isAuth } from '../../helpers/auth';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import BriefModal from './BriefModal';

const ParticipantGrid = dynamic(() => import('./ParticipantGrid'));
const ParticipantCard = dynamic(() => import('./ParticipantCard'));

function InitiateParticipant() {
  const dispatch = useDispatch();
  const user = isAuth();
  const router = useRouter();
  const [gridView, setGridView] = useState(false);
  const [activeTab, setActiveTab] = useState('initiated');
  const [openModal, setOpenModal] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [loading, participantList, formLists, managersList] = useSelector((Gstate) => [
    Gstate.participants?.loading,
    Gstate.participants?.participantList,
    Gstate.participants?.formListData,
    Gstate.participants?.MangersList,
  ]);

  const [isLoading, setLoading] = useState(false);
  const [participantData, setParticipantData] = useState({});
  const [actionType, setActionType] = useState({ add: false, edit: false, takeSurvey: false });
  const [searchKey, setSearchKey] = useState('');
  const [onLoadAssigneeFilter, setOnLoadAssigneeFilter] = useState(false);
  const [openBrief, setOpenBrief] = useState(false);
  const [participantsByType, setParticipantsByType] = useState({ initiated: [], consented: [], completed: [] });
  const handleOpen = (data) => {
    if (searchKey) {
      setSearchKey('');
    }
    setOpenModal(true);
    setActionType({ add: true, edit: false });
    if (data) {
      setParticipantData(data);
      setActionType({ add: false, edit: true, takeSurvey: true });
    }
    dispatch(setFormLists());
  };

  useEffect(() => {
    dispatch(setFormLists());
    dispatch(setParticipants(true));
    dispatch(setMangersLists());
  }, []);

  // useEffect(() => {
  //   if (!onLoadAssigneeFilter && participantList?.length && managersList?.length) {
  //     setOnLoadAssigneeFilter(true);
  //     handleFilterSurveyStatus({ target: { name: 'assignee', value: user.id } });
  //   }
  // }, [participantList, managersList]);

  const onChangeHandler = (e) => {
    setSearchKey(e.target.value);
  };

  useEffect(() => {
    if (participantList && user) {
      const assigneeId = user.id;
      setAssignee(assigneeId);
      //current_form_status updated to status
      const initiated = participantList.filter(
        (entry) =>
          ['Sent', 'Link not Sent', 'Started', 'Expired'].includes(entry?.status) &&
          (entry?.assignee || entry?.assigneeInfo?.id) === parseInt(assigneeId)
      );
      const completed = participantList.filter(
        (entry) =>
          entry?.status?.toLowerCase() == 'completed' &&
          (entry?.assignee || entry?.assigneeInfo?.id) === parseInt(assigneeId)
      );
      setParticipantsByType({ initiated, completed });
      handleFilterSurveyStatus({ target: { value: 'All' } });
    }
  }, [participantList, participantList?.length, managersList, loading]); //gridView

  const handleActiveTab = (e) => {
    if (e.target.value) {
      setActiveTab(e.target.value);
    }
  };

  const handleClose = ({ type, data, form_data }) => {
    if (type == 'click') {
      setOpenModal(false);
      return;
    }
    //actionType is used to maintain modal response action type
    if (actionType.edit) {
      updateParticipantsData(data, form_data);
    }
    if (actionType.add) {
      addParticipantsData(data);
    }
    setLoading(true);
  };

  const updateParticipantsData = (payload) => {
    if (payload.isAnonymousUser) {
      payload = { ...payload, first_name: '', last_name: '', participant_id: '', mobile_phone: '' };
    }
    const encodePayload = encodeData(payload);
    API.apiPost('updateParticipant', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setOpenModal(false);
          const tokenData = {
            form_code: payload?.form_code,
            form_name: payload?.form_name,
            form_group: payload?.form_group,
            personal_email: payload?.personal_email,
            id: payload?.id,
            user_id: payload?.id,
            isCoordinator: true,
            survey_id: participantData.survey_id,
          };
          const query = encodeData(tokenData);
          router.push(`e-consent/consent-sign?query=${query}`);
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  const addParticipantsData = (payload) => {
    if (payload.isAnonymousUser) {
      payload = { ...payload, first_name: '', last_name: '', participant_id: '', mobile_phone: '' };
    }
    const { first_name, last_name, personal_email, participant_id, mobile_phone } = payload;
    if (!first_name && !last_name && !personal_email && !participant_id && !mobile_phone) {
      payload.isAnonymousUser = true;
    }
    const encodePayload = encodeData(payload);
    API.apiPost('initiateParticipant', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setOpenModal(false);
          setLoading(false);
          dispatch(setParticipants(true));
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  const resumeSurvey = ({ form_code, form_name, form_group, personal_email, survey_id, id }) => {
    const updatedToken = encodeData({
      form_code,
      form_name,
      form_group,
      personal_email,
      survey_id,
      id: id || participantData.id,
      user_id: id || participantData.id,
    });
    router.push(`/survey?query=${updatedToken}`);
  };

  const handleFilterSurveyStatus = (event) => {
    setAssignee(event.target.value);
    setSearchKey('');
    let surveyStatus = event.target.value;
    if (event.target.name === 'assignee' && surveyStatus !== 'All') {
      if (participantList) {
        const initiated = participantList.filter(
          (entry) =>
            ['Sent', 'Link not Sent', 'Started', 'Expired'].includes(entry?.status) &&
            ((surveyStatus === 'UNASSIGNED' && !entry?.assigneeInfo) ||
              (entry.assignee || entry?.assigneeInfo?.id) === parseInt(surveyStatus))
        );
        const completed = participantList.filter(
          (entry) =>
            entry?.status == 'Completed' &&
            ((surveyStatus === 'UNASSIGNED' && !entry?.assigneeInfo) ||
              (entry.assignee || entry?.assigneeInfo?.id) === parseInt(surveyStatus))
        );
        setParticipantsByType({ initiated, completed });
      }
    } else if (participantList) {
      const initiated = participantList.filter((entry) =>
        ['Sent', 'Link not Sent', 'Started', 'Expired'].includes(entry?.status)
      );
      const completed = participantList.filter((entry) => entry?.status == 'Completed');
      // console.log(initiated, completed);
      setParticipantsByType({ initiated, completed });
    }
  };
  const Redirect = (payload) => {
    const tokenData = {
      form_code: payload?.form_code,
      form_name: payload?.form_name,
      form_group: payload?.form_group,
      personal_email: payload?.personal_email,
      id: payload?.id,
      user_id: payload?.id,
      isCoordinator: true,
      survey_id: payload.survey_id,
    };
    const query = encodeData(tokenData);
    router.push(`e-consent/consent-sign?query=${query}`);
  };

  return (
    <>
      <Modal
        className="custom-modal"
        show={openModal}
        onHide={() => setOpenModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <ParticipantModal
          handleClose={handleClose}
          actionType={actionType}
          userData={participantData}
          isLoading={isLoading}
          formLists={formLists}
          showAnynomousCheck={true}
          isCoordinator={true}
          managersList={managersList}
        />
      </Modal>
      {openBrief && <BriefModal openBrief={openBrief} setOpenBrief={setOpenBrief} />}
      {/* <div className="row mb-4 data-table-header">
        <div className="col-md-6 ">
          <label className={`float-start  ${styles.header}`}>My Participants</label>
        </div>
        <div className="col-md-6">
          <Button className="btn btn-primary mx-1  primary-button-bg float-end fw-bold" onClick={() => handleOpen(null)}>
            Initiate Participant
          </Button>
        </div>
      </div> */}
      <div className="row mb-4 mt-5 top-tabs">
        <div className="col-md-5 d-flex justify-content-start">
          <div className="btn-group" role="group" aria-label="languages" onClick={handleActiveTab}>
            <button
              name="INITIATED"
              value="initiated"
              className={`fw-bold btn me-1 ${activeTab === 'initiated' ? styles.active : styles.inactive}`}
            >
              My Tasks ({participantsByType['initiated'].length})
            </button>
            {/* <button
              name="CONSENTED"
              value="consented"
              className={`fw-bold mx-1 btn ${activeTab === 'consented' ? styles.active : styles.inactive}`}
            >
              Consented ({participantsByType['consented'].length || 0})
            </button> */}
            <button
              name="COMPLETED"
              value="completed"
              className={`fw-bold btn ${activeTab === 'completed' ? styles.active : styles.inactive}`}
            >
              Completed Tasks ({participantsByType['completed'].length})
            </button>
          </div>
        </div>
        <div className="col-md-7 d-flex justify-content-end">
          <div className={`col-lg-4 me-1 ${styles.userFilter}`}>
            <Form.Group>
              <Form.Label>Assignee</Form.Label>
              <Form.Select
                aria-label="Default select example"
                className="custom_select"
                value={assignee}
                name="assignee"
                onChange={handleFilterSurveyStatus}
              >
                <option hidden>Select Assignee</option>
                <option value="All">All</option>
                {managersList?.map((item, i) => (
                  <option key={i} value={item.id}>
                    {item?.status !== 'Active' ? '⃠ ' : ''}
                    {`${item?.first_name || ''}` + ' ' + `${item?.last_name || ''}`}
                  </option>
                ))}
                <option value="UNASSIGNED">Unassigned</option>
              </Form.Select>
            </Form.Group>
          </div>
          <InputGroup className={`search-input ${styles['search-box']}`}>
            <input
              placeholder="Search..."
              type="text"
              value={searchKey}
              onChange={onChangeHandler}
              name="searchKey"
              className="form-control"
              maxLength="15"
            />
            <div className="search-icon">
              <img src={'/images/search_icon.svg'} className="mt-1"></img>
            </div>
          </InputGroup>
          <img
            src={!gridView ? '/images/LayerActive.svg' : '/images/Layer.svg'}
            data-toggle="tooltip"
            title="List View"
            className={`float-end cursor-pointer`}
            onClick={() => setGridView(false)}
          />
          <img
            src={gridView ? '/images/GroupActive.svg' : '/images/Group.svg'}
            data-toggle="tooltip"
            title="Grid View"
            className={`float-end ms-1 cursor-pointer`}
            onClick={() => setGridView(true)}
          />
        </div>
        <div className="col-md-12 mt-4">
          <div className={`${styles['initiate-participant']} }`}>
            {gridView ? (
              <ParticipantGrid
                onTakeSurvey={(form) => Redirect(form, true)}
                searchKey={searchKey}
                setSearchKey={setSearchKey}
                formLists={formLists}
                resumeSurvey={resumeSurvey}
                participants={participantsByType[activeTab]}
                activeTab={activeTab}
                loading={loading}
              />
            ) : (
              <ParticipantCard
                onTakeSurvey={(form) => Redirect(form, true)}
                searchKey={searchKey}
                formLists={formLists}
                setSearchKey={setSearchKey}
                resumeSurvey={resumeSurvey}
                participants={participantsByType[activeTab]}
                loading={loading}
                activeTab={activeTab}
              />
            )}
          </div>
        </div>
        {/* <div className={`mt-4 ${styles.footer}`}>
          <label className={styles.text}>
            For study brief{' '}
            <a className={styles.link} onClick={() => setOpenBrief(true)}>
              Click Here
            </a>
          </label>
        </div> */}
      </div>
    </>
  );
}

export default WithAuth(InitiateParticipant);
