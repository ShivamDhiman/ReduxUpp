import { InputGroup, Table, Form, Spinner } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { setStudyManagement } from '../../store/actions/studyManagement';
import { useDispatch, useSelector } from 'react-redux';
import { getComparator, stableSort, toTitleCase } from '../../utils/commonFunctions';
import PaginationComponent from '../common/PaginationComponent';
import router from 'next/router';
import { encodeData } from '../../helpers/auth';
import { toast } from 'react-toastify';

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  userData: [],
  list: [],
};
const StudyManagement = ({ styles }) => {
  const [pagination, setPagination] = useState(initialPaginationState);
  const { activePage, skip, limitPerPage, paginatedData, userData, list } = pagination;
  const [searchKey, setSearchKey] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: '' });
  const dispatch = useDispatch();

  const [studyManagementList, loading] = useSelector((Gstate) => [
    Gstate.studyManagement?.studyManagementList,
    Gstate.studyManagement?.loading,
  ]);

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
    onPageChange(activePage);
  }, [list, activePage]);

  useEffect(() => {
    const { order, orderBy } = sorter;
    let arr = stableSort(list, getComparator(order, orderBy));
    setPagination((prev) => ({ ...prev, list: arr, activePage: 1 }));
  }, [list.length, sorter]);

  useEffect(() => {
    getStudyManagementData();
  }, []);

  useEffect(() => {
    onPageChange(1);
  }, [list.length]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, list: studyManagementList }));
  }, [studyManagementList?.length, studyManagementList]);

  const getStudyManagementData = () => {
    dispatch(setStudyManagement());
  };

  const onChangeHandler = (event) => {
    setSearchKey(event.target.value);
  };

  const handleFilter = (e) => {
    let inputSearchKey = e.target.value;
    let arr = studyManagementList.filter(
      (item) =>
        (inputSearchKey ? item.study_id?.toLowerCase().includes(inputSearchKey?.toLowerCase()) : true) ||
        (inputSearchKey ? item.name?.toLowerCase().includes(inputSearchKey?.toLowerCase()) : true) ||
        (inputSearchKey ? item.status?.toLowerCase().includes(inputSearchKey?.toLowerCase()) : true) ||
        (inputSearchKey ? item.participants?.toLowerCase().includes(inputSearchKey?.toLowerCase()) : true)
    );
    setPagination((prev) => ({
      ...prev,
      list: arr,
    }));
  };

  const handleSort = (name) => {
    if (searchKey || filterStatus) {
      setSearchKey('');
      setFilterStatus('');
      setPagination((prev) => ({
        ...prev,
        list: studyManagementList,
      }));
    }
    setSorter((prev) => ({ orderBy: name, order: prev.orderBy === name && prev.order === 'asc' ? 'desc' : 'asc' }));
  };

  const handleFilterSurveyStatus = (event) => {
    setFilterStatus(event.target?.value);
    setSearchKey('');
    let surveyStatus = event.target.value;
    if (!(surveyStatus && surveyStatus === 'all')) {
      let arr = studyManagementList.filter((item) =>
        surveyStatus ? item.status?.toLowerCase().includes(surveyStatus?.toLowerCase()) : true
      );
      setPagination((prev) => ({
        ...prev,
        list: arr,
      }));
    } else {
      setPagination((prev) => ({
        ...prev,
        list: studyManagementList,
      }));
    }
  };

  const viewStudy = (id) => {
    let encryptedPayload = encodeData({ id });
    router.push({
      pathname: '/study-management/view',
      query: { search: encryptedPayload },
    });
  };
  const editStudy = (id) => {
    let encryptedPayload = encodeData({ id });
    router.push({
      pathname: '/study-management/edit',
      query: { search: encryptedPayload },
    });
  };
  const isDisabled = (Status) => {
    if (['all', 'completed'].includes(Status?.toLowerCase())) {
      toast.error("You can't edit for completed or all");
      return false;
    }
    return true;
  };

  return (
    <>
      <div className="row mb-4 data-table-header">
        <div className="col-md-12 d-flex justify-content-end">
          <button
            className={`btn btn-primary primary-button-bg me-0 ${styles.newParticipantbtn}`}
            onClick={() => {
              router.push('/study-management/add');
            }}
          >
            Add Study
          </button>
        </div>
        <div className="row-md mt-1  d-flex justify-content-between">
          <div className="col-md-2 ms-1">
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                aria-label="Default select example"
                className="custom_select"
                value={filterStatus}
                onChange={handleFilterSurveyStatus}
              >
                {/* <option hidden>Select Status</option> */}
                <option value="all">All</option>
                <option value="onboarding">Onboarding</option>
                <option value="Live">Live</option>
                {/* <option value="active">Active</option> */}
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>
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
        <Table hover className="data-table">
          <thead>
            <tr>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('study_id')}>
                  <span>Study ID</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('name')}>
                  <span>Study Name</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('status')}>
                  <span>Status</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('participants')}>
                  <span>Participants Enrolled</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('records_pushed')}>
                  <span>Records Pushed</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i}>
                <td>
                  <div className="td-max-content"> {`${row?.study_id || ''}`}</div>
                </td>
                <td>
                  <div className="td-max-content">{row?.name || '-'}</div>
                </td>
                <td>{toTitleCase(row?.status) || '-'}</td>
                <td>{row?.participants || '-'}</td>
                <td>{row?.records_pushed || '-'}</td>
                <td>
                  <div className="d-flex justify-content-between me-2">
                    <img
                      src={'/images/eye.svg'}
                      onClick={() => viewStudy(row?.id)}
                      data-toggle="tooltip"
                      title="View Study"
                      className="cursor-pointer mx-2"
                    />
                    <img
                      src={'/images/editIcon.svg'}
                      className="cursor-pointer me-3 "
                      data-toggle="tooltip"
                      onClick={() => isDisabled(row.status) && editStudy(row?.id)}
                      title="Edit Study"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
        {!loading && (
          <div className={`d-flex justify-content-${list?.length ? 'end' : 'center'}`}>
            <PaginationComponent
              currentPage={activePage}
              list={list}
              skip={skip}
              limitPerPage={limitPerPage}
              loading={loading}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default StudyManagement;
