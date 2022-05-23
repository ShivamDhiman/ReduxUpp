import { InputGroup, Table, Modal, Form, Spinner, Button, Dropdown, OverlayTrigger, Popover } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import API from '../../helpers/api';
import { setParticipants, setFormLists, setMangersLists } from '../../store/actions/participants';
import { toast } from 'react-toastify';
import { decodeData, encodeData } from '../../helpers/auth';
import moment from 'moment';
import { handleErrorMessage, getComparator, stableSort, toTitleCase } from '../../utils/commonFunctions';
import styles from '../../stylesheets/Common.module.scss';
import ParticipantModal from './ParticipantModal';
import ConfirmationModal from './confirmationModal';
import PaginationComponent from '../common/PaginationComponent';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { clearFormData, fetchSurveyData } from '../../store/actions/survey';

// const currentFormStatusMappings = {
//   INITIATED: 'Sent',
//   CONSENTED: 'Started',
//   COMPLETED: 'Completed',
// };

const statusDateFieldMappings = {
  Sent: 'form_send_date',
  Scheduled: 'scheduled_at',
  'Link Not Sent': '',
  Started: 'initiated_at',
  Completed: 'completed_at',
  Expired: 'form_expire_at',
};

function removeAnonymous(arr) {
  if (arr?.length) {
    return arr.filter((item) => item.status !== 'ANONYMOUS');
  }
  return arr;
}

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  userData: [],
  list: [],
};
const ParticipantManagement = () => {
  const [popoverForms, setPopoverForms] = useState([]);
  const [popoverLoader, setPopoverLoader] = useState(false);
  const [pagination, setPagination] = useState(initialPaginationState);
  const { activePage, skip, limitPerPage, paginatedData, userData, list = [] } = pagination;
  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [actionType, setActionType] = useState({ add: false, edit: false });
  const [searchKey, setSearchKey] = useState('');
  const [participantData, setParticipantData] = useState({});
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: 'first_name' });
  const [showDelete, setShowDelete] = useState(false);
  const [assigneefilter, setAssigneefilter] = useState();
  const [filters, setFilters] = useState({});
  const [participantLoading, participants, formLists, managersList] = useSelector((Gstate) => [
    Gstate.participants?.loading,
    Gstate.participants?.participantList,
    Gstate.participants?.formListData,
    Gstate.participants?.MangersList,
  ]);
  const router = useRouter();
  const dispatch = useDispatch();
  const form_status = ['completed', 'consented'];

  const onPageChange = (page) => {
    var skipRecords = (page - 1) * limitPerPage;
    const to = limitPerPage * page;
    setPagination((prev) => ({
      ...prev,
      activePage: page,
      skip: skipRecords,
      paginatedData: list.slice(skipRecords, to),
      userData: list.slice(skipRecords, to),
    }));
  };

  useEffect(() => {
    if (list.length) {
      onPageChange(activePage);
    }
  }, [list, activePage]);

  // useEffect(() => {
  //   if (filters && participants) {
  //     let { assigneefilter = '', current_form_status = '', journey = '' } = filters;
  //     assigneefilter = assigneefilter.toLowerCase();
  //     current_form_status = current_form_status.toLowerCase();
  //     journey = journey.toLowerCase();

  //     let arr = removeAnonymous(participants)?.filter((item) => {
  //       return assigneefilter
  //         ? assigneefilter === 'unassigned'
  //           ? item.status?.toLowerCase() === 'unassigned'
  //           : (item.assignee || item.assigneeInfo?.id) == assigneefilter
  //         : true && current_form_status
  //         ? item?.current_form_status?.toLowerCase() == current_form_status
  //         : true && journey
  //         ? item.status?.toLowerCase() == journey || item.assigneeInfo?.current_form_status?.toLowerCase() == journey
  //         : true;
  //     });
  //     setPagination((prev) => ({
  //       ...prev,
  //       list: arr,
  //     }));
  //   }
  // }, [filters, participants]);

  const handleSelectFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    let arr = [];
    // switch (name) {
    //   case 'journey':
    //     arr = participants.filter((item) => (value == 'all' ? true : item?.journey?.toLowerCase() === value.toLowerCase()));
    //     break;
    //   case 'assigneefilter':
    //     if (value === 'UNASSIGNED') {
    //       arr = participants.filter((item) => !item?.assigneeInfo);
    //     } else {
    //       arr = participants.filter((item) => (value == 'all' ? true : item?.assigneeInfo?.id === parseInt(value)));
    //     }
    //     break;
    //   case 'current_form_status':
    //     arr = participants.filter((item) => (value == 'all' ? true : item?.status.toLowerCase() === value.toLowerCase()));
    //     break;
    // }

    // setPagination((prev) => ({
    //   ...prev,
    //   list: arr,
    // }));
  };

  useEffect(() => {
    let assigneefilter = filters.assigneefilter || 'all';
    let current_form_status = filters.current_form_status || 'all';
    let journey = filters.journey || 'all';

    let arr2 = participants.filter(
      (item) =>
        (journey == 'all' ? true : item?.journey?.toLowerCase() === journey.toLowerCase()) &&
        (assigneefilter == 'all'
          ? true
          : assigneefilter == 'UNASSIGNED'
          ? !item?.assigneeInfo
          : item?.assigneeInfo?.id == parseInt(assigneefilter)) &&
        (current_form_status == 'all' ? true : item?.current_form_status.toLowerCase() == current_form_status.toLowerCase())
    );
    setPagination((prev) => ({
      ...prev,
      list: arr2,
    }));
  }, [filters]);
  const handleOpen = (data) => {
    if (searchKey) {
      setSearchKey('');
      setPagination((prev) => ({
        ...prev,
        list: removeAnonymous(participants),
      }));
    }

    setOpenModal(true);
    setActionType({ add: true, edit: false });
    if (data) {
      setParticipantData(data);
      setActionType({ add: false, edit: true });
    }
  };

  const handleClose = ({ type, data }) => {
    if (type == 'click') {
      setOpenModal(false);
      return;
    }
    //actionType is used to maintain modal response action type
    if (actionType.edit) {
      updateParticipantsData(data);
    }
    if (actionType.add) {
      addParticipantsData(data);
    }
    setLoading(true);
  };

  useEffect(() => {
    getParticipantsData();
    dispatch(setMangersLists());
    dispatch(setFormLists());
  }, []);

  useEffect(() => {
    if (list && list.length) {
      const { order, orderBy } = sorter;
      let arr = stableSort(list, getComparator(order, orderBy));
      setPagination((prev) => ({ ...prev, list: [...arr], activePage: 1 }));
    }
  }, [sorter]);

  useEffect(() => {
    onPageChange(1);
  }, [list?.length]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, list: removeAnonymous(participants) }));
  }, [participants.length, participants]);

  const getParticipantsData = () => {
    dispatch(setParticipants());
  };

  const updateParticipantsData = (payload) => {
    if (!payload?.participant_id) {
      delete payload['participant_id'];
    }
    const encodePayload = encodeData(payload);
    API.apiPost('updateParticipant', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          dispatch(setParticipants());
          setOpenModal(false);
          setLoading(false);
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };
  const addParticipantsData = (payload) => {
    if (!payload?.participant_id) {
      delete payload['participant_id'];
    }
    payload.role_id = 1;
    const encodePayload = encodeData(payload);

    API.apiPost('initiateParticipant', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          if (sorter.orderBy) {
            setSorter({ orderBy: '' });
          }
          dispatch(setParticipants());
          setOpenModal(false);
          setLoading(false);
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  const resendSurvey = (payload) => {
    setSearchKey('');
    setLoading(true);
    const encodePayload = encodeData(payload);
    API.apiPost('resendSurvey', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setLoading(false);
          toast.success(response.data.message);
          dispatch(setParticipants());
        }
      })
      .catch((err) => {
        console.log('err', err);
        handleErrorMessage(err);

        setLoading(false);
      });
  };

  const onConfirmDelete = (bool) => {
    if (!bool) {
      setShowDelete(false);
      return;
    }
    setLoading(true);
    // let personal_email = showDelete;
    // const encodePayload = encodeData({ personal_email });
    const { id, form_code } = showDelete;
    const encodePayload = encodeData({ id, form_code });
    API.apiPost('deleteParticipant', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setLoading(false);
          setShowDelete(false);
          toast.success(response.data.message);
          dispatch(setParticipants());
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  const deleteParticipant = (personal_email, id, form_code) => {
    setSearchKey('');
    setShowDelete({ id, form_code });
  };

  const onChangeHandler = (event) => {
    setSearchKey(event.target.value);
  };

  const handleFilter = (e) => {
    let searchvalue = e.target.value;
    let arr = removeAnonymous(participants)?.filter(
      (item) =>
        (searchvalue ? item.first_name?.toLowerCase().includes(searchvalue.toLowerCase()) : true) ||
        (searchvalue ? item.last_name?.toLowerCase().includes(searchvalue.toLowerCase()) : true) ||
        (searchvalue ? item.personal_email?.toLowerCase().includes(searchvalue.toLowerCase()) : true)
    );
    setPagination((prev) => ({
      ...prev,
      list: arr,
    }));
  };

  const titleCase = (str) => {
    return str
      ?.split(' ')
      .map((w) => w[0]?.toUpperCase() + w?.substr(1)?.toLowerCase())
      .join(' ');
  };

  const handleSort = (name) => {
    setSorter((prev) => ({ orderBy: name, order: prev.orderBy === name && prev.order === 'asc' ? 'desc' : 'asc' }));
  };

  const isParticipantFacing = (row) => {
    let found = formLists.find((form) => form?.name === row?.form_name && form?.form_code === row?.form_code);
    return found && found?.participant_facing ? true : false;
  };

  const previewFormCompletedData = (row) => {
    setPopoverForms([]);
    setPopoverLoader(true);
    const query = `?id=${row.id}&form_code=${row.form_code}&form_group=${row.form_group}`;
    API.apiGet('participantDetails', query)
      .then((response) => {
        setPopoverLoader(false);
        if (response?.data?.status === true && response.data?.data?.formData?.length) {
          //provide participant_id on each formlist
          const formatedFormData = response.data.data.formData.map((item) => {
            item.participant_id = response.data.data?.participant_id;
            return item;
          });
          setPopoverForms(formatedFormData);
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        setPopoverLoader(false);
      });
  };

  const perviewFormData = (row) => {
    const {
      first_name,
      last_name,
      participant_id,
      assignee,
      personal_email,
      mobile_phone,
      form_code,
      form_group,
      form_name,
      id,
      UID,
      sendEmailNow,
    } = row;
    const payload = encodeData({
      first_name,
      last_name,
      participant_id,
      assignee,
      personal_email,
      mobile_phone,
      form_code,
      form_group,
      form_name,
      id,
      UID,
      sendEmailNow,
    });
    router.push(`/participant-management/${payload}`);
  };
  useEffect(() => {
    if (router.query.redirect) {
      const decoded = decodeData(router.query.redirect);
      setOpenModal(true);
      setParticipantData(decoded);
      setActionType({ add: false, edit: true });
    }
  }, []);

  // const getCurentStatusMappings = (status) => {
  //   if (status) {
  //     return currentFormStatusMappings[status] || '-';
  //   } else {
  //     return '-';
  //   }
  // };

  const popover = () => (
    <Popover id="popover-basic">
      <Popover.Header as="h3">Form Details</Popover.Header>
      <Popover.Body className={styles.popoverText}>
        {
          <>
            {popoverLoader && <span>Loading...</span>}
            {!popoverLoader &&
              popoverForms.map((data) => (
                <div>
                  {form_status.includes(data?.status.toLowerCase()) && (
                    <a className="cursor-pointer" onClick={() => viewFormData(data)}>
                      {data.form_name}
                    </a>
                  )}
                  {!form_status.includes(data?.status.toLowerCase()) && <a>{data.form_name}</a>} :{' '}
                  {data?.completed_at ? moment(data?.completed_at).format('MM-DD-YY h:mm') : '-'}
                  <br></br>
                </div>
              ))}
          </>
        }
      </Popover.Body>
    </Popover>
  );

  const viewFormData = (data) => {
    dispatch(clearFormData());
    let tokenInfo = {
      personal_email: data.personal_email,
      form_code: data.form_code,
      form_name: data.form_name,
      form_code: data.form_code,
      form_group: data.form_group,
      survey_id: data.id,
      participant_id: data?.participant_id,
      study_id: data?.study_id,
      user_id: data?.user_id,
      completed_at: data?.completed_at,
      participant_management_form: true,
    };
    console.log(tokenInfo);
    const encodeToken = encodeData(tokenInfo);
    router.push(`/data-management/${encodeToken}`);
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
          showAnynomousCheck={false}
          managersList={managersList}
        />
      </Modal>
      <Modal
        className={`custom-modal`}
        show={showDelete}
        onHide={() => setShowDelete(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <ConfirmationModal handleClose={onConfirmDelete} isLoading={isLoading} />
      </Modal>
      <div className="row mb-4 data-table-header">
        <div className="col-md-12 d-flex justify-content-end">
          <button
            className={`btn btn-primary primary-button-bg me-0 ${styles.newParticipantbtn}`}
            onClick={() => {
              handleOpen(false);
            }}
          >
            Add Participant
          </button>
        </div>
        <div className="row-md mt-1  d-flex justify-content-between">
          <div className="col-md-8 d-flex">
            <div className="col-md-3 ms-1">
              <Form.Group>
                <Form.Label>Assignee</Form.Label>
                <Form.Select
                  aria-label="Default select example"
                  className="custom_select"
                  value={filters?.assigneefilter}
                  name="assigneefilter"
                  onChange={handleSelectFilter}
                >
                  <option hidden>Select Assignee</option>
                  <option value="all">All</option>
                  {managersList.map((item, i) => (
                    <option key={i} value={item.id}>
                      {item?.status !== 'Active' ? '⃠ ' : ''}
                      {`${item?.first_name || ''}` + ' ' + `${item?.last_name || ''}`}
                    </option>
                  ))}
                  <option value="UNASSIGNED">Unassigned</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-3 ms-3">
              <Form.Group>
                <Form.Label>Current Form Status</Form.Label>
                <Form.Select
                  aria-label="Default select example"
                  className="custom_select"
                  name="current_form_status"
                  value={filters?.current_form_status}
                  onChange={handleSelectFilter}
                >
                  <option hidden>Select Form Status</option>
                  <option value="all">All</option>
                  <option value="Link Not Sent">Link Not Sent</option>
                  <option value="Sent">Sent</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Started">Started</option>
                  <option value="Completed">Completed</option>
                  <option value="Expired">Expired</option>
                </Form.Select>
              </Form.Group>
            </div>
            {/* <div className="col-md-3 ms-3">
              <Form.Group>
                <Form.Label>Participant Status</Form.Label>
                <Form.Select
                  aria-label="Default select example"
                  className="custom_select"
                  name="journey"
                  onChange={handleSelectFilter}
                  value={filters?.journey}
                >
                  <option hidden>Select Status</option>
                  <option value="all">All</option>
                  <option value="Registered">Registered</option>
                  <option value="Consented">Consented</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </div> */}
          </div>
          <div className="col-md-3 d-flex align-items-end" onChange={onChangeHandler}>
            <InputGroup className="search-input">
              <input
                placeholder="Search..."
                type="text"
                autoComplete="off"
                className="form-control"
                name="searchKey"
                value={searchKey}
                maxLength="15"
                onChange={handleFilter}
              />
              <div className="search-icon cursor-pointer">
                <img src={'/images/search_icon.svg'}></img>
              </div>
            </InputGroup>
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <Table className="data-table">
          <thead>
            <tr>
              <th className="ps-3">Sr. No.</th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('first_name')}>
                  <span>Arm</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('first_name')}>
                  <span>Participant Name</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('participant_id')}>
                  <span>Participant Id</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('assigneeInfo.first_name')}>
                  <span>Assignee</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('assignee')}>
                  <span>Forms Completed</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('form_name')}>
                  <span>Current Form</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('status')}>
                  <span>Current Form Status</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              {/* <th>
                <span className="alignTableHeading" onClick={() => handleSort('journey')}>
                  <span>Participant Status</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th> */}
              {/* <th>
                <span className="alignTableHeading" onClick={() => handleSort('personal_email')}>
                  <span>Email</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th> */}
              {/* <th>
                <span className="alignTableHeading" onClick={() => handleSort('mobile_phone')}>
                  <span>Phone No.</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>Survey Status</th>
              <th>Form Name</th> */}
              {/* <th>Re-Send Survey Link</th> */}
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i}>
                <td>{skip + i + 1}</td>
                <td>{row?.Arm?.name || '-'}</td>
                <td>{`${row?.first_name || ''} ${row?.last_name || ''}`}</td>
                <td>{row?.participant_id || '-'}</td>
                <td>{`${row?.assigneeInfo?.first_name || ''} ${row?.assigneeInfo?.last_name || ''}`} </td>
                <td className="table-data cursor-pointer px-4">
                  {row?.forms_completed != '0' ? (
                    <OverlayTrigger onExit={false} rootClose trigger="click" placement="right" overlay={popover()}>
                      <a onClick={() => previewFormCompletedData(row)}>{row?.forms_completed || '0'}</a>
                    </OverlayTrigger>
                  ) : (
                    '0'
                  )}
                </td>
                <td>{row?.current_form_name || '-'}</td>
                <td>
                  {row?.current_form_status || '- '}
                  {'    '}
                  {statusDateFieldMappings[row?.current_form_status] &&
                  row[statusDateFieldMappings[row?.current_form_status]]
                    ? moment(row[statusDateFieldMappings[row?.current_form_status]]).format('MM-DD-YY')
                    : ' '}
                </td>
                {/* <td>{row?.journey || '-'}</td> */}
                {/* <td>{row?.Journey || '-'}</td> */}

                {/* <td>{row?.personal_email || '-'}</td> */}
                {/* <td>{parseInt(row?.mobile_phone) ? `+1${parseInt(row?.mobile_phone)}` : '-'}</td>
                <td>{`${titleCase(row?.current_form_status || '')} (${moment(row?.updated_at).format('MM-DD-YYYY')})`}</td>
                <td>{row?.form_name || '-'}</td> */}
                {/* <td>
                  <button
                    disabled={row?.survey_status !== 'INITIATED'}
                    onClick={() => resendSurvey(row)}
                    className={`d-flex mx-auto cursor-pointer ${styles.linkBtn}`}
                  >
                    <img
                      src={'/images/linkIcon.svg'}
                      data-toggle="tooltip"
                      title="Resend Survey"
                      className={`${row?.survey_status !== 'INITIATED' ? 'opacity-50' : ''}`}
                    />
                  </button>
                </td> */}
                {/* <td>
                  <div className="d-flex justify-content-between me-2">
                    <img
                      src={'/images/editIcon.svg'}
                      className="cursor-pointer me-3 "
                      data-toggle="tooltip"
                      title="Edit Participant"
                      onClick={() => {
                        handleOpen(row);
                      }}
                    />
                    <img
                      src={'/images/deleteIcon.svg'}
                      data-toggle="tooltip"
                      title="Deregister Participant"
                      className="cursor-pointer"
                      onClick={() => deleteParticipant(row?.personal_email, row?.id, row?.form_code)}
                    />
                  </div>
                </td> */}
                <td>
                  {row?.current_form_status?.toLowerCase() === 'link not sent' && (
                    <img
                      src={'/images/linkNotSent.svg'}
                      data-toggle="tooltip"
                      title="Link Not Sent"
                      className="cursor-pointer px-4"
                    />
                  )}
                </td>
                <td>
                  <div className="d-flex justify-content-around">
                    <img
                      src={'/images/eye.svg'}
                      data-toggle="tooltip"
                      title="View"
                      onClick={() => perviewFormData(row)}
                      className="cursor-pointer px-4"
                    />

                    <Dropdown>
                      <Dropdown.Toggle id="dropdown-basic" className={`bg-white border-0 p-0 ${styles.toggleButton}`}>
                        <img src={'/images/three-dot-icon.svg'} className="cursor-pointer mb-1 " />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          className={styles.menuItems}
                          disabled={['Completed', 'Scheduled', 'Expired'].includes(row?.status) || !isParticipantFacing(row)}
                          onClick={() => resendSurvey(row)}
                        >
                          Send survey link
                        </Dropdown.Item>
                        <Dropdown.Item
                          className={`d-flex mx-auto cursor-pointer ${styles.menuItems}`}
                          onClick={() => deleteParticipant(row?.personal_email, row?.id, row?.form_code)}
                        >
                          Deregister
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    {/* <Dropdown className={styles.dropdownMenu}>
                      <Dropdown.Toggle
                        id="dropdown-basic"
                        data-toggle="tooltip"
                        title="View Actions"
                        className={`bg-white border-0 p-0 ${styles.toggleButton}`}
                      >
                        <img src={'/images/three-dot-icon.svg'} className="cursor-pointer mb-1 " />
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item>
                          <button
                            disabled={!['INITIATED', 'CONSENTED'].includes(row?.current_form_status)}
                            onClick={() => resendSurvey(row)}
                            className={`d-flex mx-auto cursor-pointer ${styles.linkBtn}`}
                          ></button>
                        </Dropdown.Item>
                        <Dropdown.Item>
                          <button>
                            <label className="text-start">Deregister</label>
                          </button>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!participantLoading && !list.length && <div className="d-flex justify-content-center">No Records Found.</div>}
        {participantLoading && (
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
        )}
        {!!list.length && (
          <div className="d-flex justify-content-end">
            <PaginationComponent
              currentPage={activePage}
              list={list}
              skip={skip}
              limitPerPage={limitPerPage}
              loading={isLoading}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ParticipantManagement;
