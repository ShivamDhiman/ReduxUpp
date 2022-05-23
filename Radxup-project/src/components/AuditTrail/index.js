import { useEffect, useState } from 'react';
import { Form, Table, InputGroup, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { auditTrailDataList } from '../../store/actions/auditTrail';
import { WithAuth } from '../common/WithAuth';
import moment from 'moment';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import PaginationComponent from '../common/PaginationComponent';
import { getComparator, stableSort } from '../../utils/commonFunctions';
import _ from 'lodash';

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  list: [],
};
const AuditTrail = ({ styles }) => {
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pagination, setPagination] = useState(initialPaginationState);
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: '' });
  const [auditLoading, auditTrailList] = useSelector((Gstate) => [Gstate.auditTrail?.loading, Gstate.auditTrail?.auditList]);
  const { activePage, skip, limitPerPage, paginatedData, list } = pagination;
  const [studyId, setStudyId] = useState('');

  useEffect(() => {
    if (auditTrailList?.length) {
      const arr = _.uniqBy(auditTrailList, 'study_id');
      const arrList = arr.map((el, i) => {
        el.index = i + 1;
        return el;
      });
      setStudyId(arr);
    }
  }, [auditTrailList]);

  useEffect(() => {
    onPageChange(activePage);
  }, [list, activePage]);

  useEffect(() => {
    const arrList = auditTrailList.map((el, i) => {
      el.index = i + 1;
      return el;
    });
    setPagination((prev) => ({ ...prev, list: arrList }));
    if (auditTrailList) {
      let myCurrentDate = new Date();
      let myPastDate = new Date(myCurrentDate);
      myPastDate.setDate(myPastDate.getDate() - 7);
      setStartDate(myPastDate);
      setEndDate(new Date());
    }
  }, [auditTrailList.length, auditTrailList]);

  useEffect(() => {
    dispatch(auditTrailDataList());
  }, []);

  useEffect(() => {
    const { order, orderBy } = sorter;
    if (!list.length) {
      return;
    }
    let arr = stableSort(list, getComparator(order, orderBy));
    setPagination((prev) => ({ ...prev, list: arr }));
  }, [list.length, sorter]);

  useEffect(() => {
    if (startDate || endDate) {
      let filteredData = auditTrailList.filter((record) => {
        if (startDate && endDate) {
          return (
            moment(record.created_at).isSameOrAfter(moment(startDate, 'MM-DD-YYYY'), 'day') &&
            moment(record.created_at).isSameOrBefore(moment(endDate, 'MM-DD-YYYY'), 'day')
          );
        } else if (endDate) {
          return moment(record.created_at).isSameOrBefore(moment(endDate, 'MM-DD-YYYY'), 'day');
        } else if (startDate) {
          return moment(record.created_at).isSameOrAfter(moment(startDate, 'MM-DD-YYYY'), 'day');
        }
      });
      setPagination((prev) => ({
        ...prev,
        activePage: 1,
        list: filteredData,
      }));
    }
    if (!startDate && !endDate) {
      setPagination((prev) => ({
        ...prev,
        list: auditTrailList,
      }));
    }
  }, [startDate, endDate]);

  const minDate = (currentDate) => {
    if (endDate) {
      return currentDate.isSameOrBefore(moment(endDate), 'MM-DD-YYYY');
    }
    return currentDate.isSameOrBefore(moment(), 'MM-DD-YYYY');
  };

  const maxDate = (currentDate) => {
    if (startDate) {
      return (
        currentDate.isSameOrBefore(moment().format('MM-DD-YYYY')) &&
        currentDate.isSameOrAfter(moment(startDate).format('MM-DD-YYYY'))
      );
    }
    return currentDate.isSameOrBefore(moment().format('MM-DD-YYYY'));
  };

  const RenderInput = (props) => {
    function clear() {
      props.onChange({ target: { value: '' } });
    }
    const cancelImage = <img className={`me-1 ms-1 ${styles['clear-btn']}`} onClick={clear} src="/images/cancel.svg" />;
    return (
      <div>
        <input {...props} />
        {startDate && props.dateType === 'startDate' && cancelImage}
        {endDate && props.dateType === 'endDate' && cancelImage}
      </div>
    );
  };

  const handleFilterSurveyStatus = (event) => {
    let surveyStatus = event.target.value;
    if (!(surveyStatus && surveyStatus === 'all')) {
      let arr = auditTrailList.filter((item) =>
        surveyStatus ? item.study_id?.toLowerCase().includes(surveyStatus.toLowerCase()) : true
      );
      setPagination((prev) => ({
        ...prev,
        list: arr,
        activePage: 1,
      }));
    } else {
      setPagination((prev) => ({
        ...prev,
        list: auditTrailList,
      }));
    }
  };
  const handleSort = (name) => {
    setSorter((prev) => ({ orderBy: name, order: prev.orderBy === name && prev.order === 'asc' ? 'desc' : 'asc' }));
  };

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

  return (
    <>
      <div className="row-md mt-1 mb-3 d-flex justify-content-between">
        <div className="col-md-3 ms-1">
          <Form.Group>
            <Form.Label>Select Study ID:</Form.Label>
            <Form.Select aria-label="Default select example" className="custom_select" onChange={handleFilterSurveyStatus}>
              <option hidden>Select Study ID</option>
              <option value="all">All</option>
              {studyId?.length &&
                studyId?.map((item) => (
                  <option key={item?.study_id} value={item?.study_id}>
                    {item?.study_id || ''}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
        </div>
        <div className="col-lg-5 col-md-5 d-flex gap-2 justify-content-end ">
          <div className="col-md-3 align-self-end custom-input-deck">
            <InputGroup className="custom-input">
              <InputGroup.Text className="bg-white border-0 " htmlFor="end-date">
                <img src={'/images/calendarIcon.svg'} />
              </InputGroup.Text>
              <Datetime
                dateFormat="MM-DD-YYYY"
                isValidDate={minDate}
                value={startDate}
                closeOnSelect={true}
                className={`ps-0 ${styles.dateInput}`}
                onChange={(e) => {
                  if (typeof e !== 'string') {
                    setStartDate(e.format('MM-DD-YYYY'));
                  }
                  if (!e) {
                    setStartDate('');
                  }
                }}
                timeFormat={false}
                renderInput={(props) => <RenderInput {...props} dateType={'startDate'} />}
              />
            </InputGroup>
          </div>
          <small className="align-self-end mb-2">To</small>
          <div className="col-md-3 custom-input-deck align-self-end">
            <InputGroup className="custom-input">
              <InputGroup.Text className="bg-white border-0" htmlFor="end-date">
                <img src={'/images/calendarIcon.svg'} />
              </InputGroup.Text>
              <Datetime
                dateFormat="MM-DD-YYYY"
                value={endDate}
                isValidDate={maxDate}
                className={`${styles.dateInput}`}
                closeOnSelect={true}
                onChange={(e) => {
                  if (typeof e !== 'string') {
                    if (startDate && moment(startDate).isAfter(e)) {
                      setStartDate(e.format('MM-DD-YYYY'));
                    }
                    setEndDate(e.format('MM-DD-YYYY'));
                  }
                  if (!e) {
                    setEndDate('');
                  }
                }}
                timeFormat={false}
                renderInput={(props) => <RenderInput {...props} dateType={'endDate'} />}
              />
            </InputGroup>
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <Table hover className="data-table">
          <thead>
            <tr>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('index')}>
                  <span>SI No.</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('personal_email')}>
                  <span>Incommon ID</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('message')}>
                  <span>Action</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('created_at')}>
                  <span>Date {'&'} Time</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i}>
                <td>{row.index || i + 1 + skip} </td>
                <td>{row?.personal_email || ''} </td>
                <td>{row?.message || '-'}</td>
                <td>{moment(row?.created_at).format('MM-DD-YYYY ; hh:mm a')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!auditLoading && !list.length && <div className="d-flex justify-content-center">No Records Found.</div>}
        {auditLoading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
        {!!list.length && (
          <div className="d-flex justify-content-end">
            <PaginationComponent
              currentPage={activePage}
              list={list}
              skip={skip}
              limitPerPage={limitPerPage}
              loading={auditLoading}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default WithAuth(AuditTrail);
