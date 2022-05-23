import { InputGroup, Table, Modal, Form, Spinner, Button, Dropdown } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import API from '../../helpers/api';
import { setUsers } from '../../store/actions/UserManagement';
import { toast } from 'react-toastify';
import moment from 'moment';
import { handleErrorMessage, getComparator, stableSort, toTitleCase } from '../../utils/commonFunctions';
import UserModal from './userManagementModal';
import PaginationComponent from '../common/PaginationComponent';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import ConfirmationModal from '../common/confirmationModal';
import { ADMIN_ROLE, COORDINATOR_ROLE } from '../../constants/constant';
import { isAuth, encodeData } from '../../helpers/auth';

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  userData: [],
  list: [],
};

const role = { ADMIN_ROLE, COORDINATOR_ROLE };

const UserManagement = (props) => {
  const { styles } = props;
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
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});
  const [loading, UsersList] = useSelector((Gstate) => [Gstate.UserManagement?.loading, Gstate.UserManagement?.UsersList]);
  const userDataDetails = useSelector(({ user }) => user.userData) || isAuth();

  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setUsers());
  }, []);

  useEffect(() => {
    if (UsersList && UsersList?.length) {
      setPagination((prev) => ({ ...prev, list: removeAnonymous(UsersList) }));
    }
  }, [UsersList, UsersList?.length]);

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

  const handleOpen = (data) => {
    if (searchKey) {
      setSearchKey('');
      setPagination((prev) => ({
        ...prev,
        list: removeAnonymous(UsersList),
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
    setLoading(true);
    if (type === 'add') {
      addParticipantsData(data);
      return;
    }
    setOpenModal(false);
  };

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

  const addParticipantsData = (payloadObj) => {
    const encodePayload = encodeData(payloadObj);
    API.apiPost('AddUser', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          if (sorter.orderBy) {
            setSorter({ orderBy: '' });
          }
          dispatch(setUsers());
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

  const onConfirmDelete = (data) => {
    if (data.actionType !== 'Delete') {
      setShowModal(false);
      return;
    }
    setLoading(true);
    const { personal_email, role_id, status } = data?.row;
    const payloadObj = { email: personal_email, role_id, status: 'Inactive' };
    const encodePayload = encodeData(payloadObj);
    API.apiPost('DeleteUser', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setLoading(false);
          setShowModal(false);
          toast.success(response.data.message);
          dispatch(setUsers());
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  const onChangeHandler = (event) => {
    setSearchKey(event.target.value);
  };

  const handleFilter = (e) => {
    let searchvalue = e.target.value;
    let arr = removeAnonymous(UsersList)?.filter(
      (item) =>
        (searchvalue ? item.personal_email?.toLowerCase().includes(searchvalue.toLowerCase()) : true) ||
        (searchvalue ? item.role_id == searchvalue : true)
    );
    setPagination((prev) => ({
      ...prev,
      list: arr,
    }));
  };

  function removeAnonymous(arr) {
    if (arr?.length) {
      return arr.filter((item) => item.status !== 'ANONYMOUS');
    }
    return arr;
  }

  const handleSort = (name) => {
    setSorter((prev) => ({ orderBy: name, order: prev.orderBy === name && prev.order === 'asc' ? 'desc' : 'asc' }));
  };

  const Deregister = (row) => {
    let actionType = 'Delete';
    setPayloadData({
      actionType,
      row,
    });
    setShowModal(true);
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
        <UserModal handleClose={handleClose} userData={participantData} isLoading={isLoading} />
      </Modal>
      {ShowModal && <ConfirmationModal open={ShowModal} handleClose={onConfirmDelete} data={payloadData} />}
      <div className="row mb-3 data-table-header">
        <div className="col-md-12 d-flex justify-content-end">
          <button
            className={`btn btn-primary btn-md primary-button-bg me-0 ${styles.newParticipantbtn}`}
            onClick={() => {
              handleOpen(false);
            }}
          >
            Add User
          </button>
        </div>
        <div className="row-md mt-3  d-flex justify-content-end">
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
                <span className="alignTableHeading" onClick={() => handleSort('personal_email')}>
                  <span>InCommon ID</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('role_id')}>
                  <span>Role </span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span>Deregister</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData?.map((row, i) => (
              <tr key={i}>
                <td>{skip + i + 1}</td>
                <td>{`${row?.personal_email || ''}`}</td>
                <td>{row?.role_id === role.COORDINATOR_ROLE ? 'Study Coordindator' : 'Study Admin' || '-'}</td>
                <td>
                  {row?.status === 'Active' && userDataDetails?.id != row?.id ? (
                    <img
                      src={'/images/trash.svg'}
                      data-toggle="tooltip"
                      title="Delete"
                      onClick={() => Deregister(row)}
                      className="cursor-pointer px-4"
                    />
                  ) : (
                    <img
                      src={'/images/trash.svg'}
                      data-toggle="tooltip"
                      title="Inactive"
                      className={`cursor-pointer px-4 ${styles.imagedim}`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && !list.length && <div className="d-flex justify-content-center">No Records Found.</div>}
        {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
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

export default UserManagement;
