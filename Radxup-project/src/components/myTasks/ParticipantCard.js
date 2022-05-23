import dynamic from 'next/dynamic';
import { Dropdown, Table } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { getComparator, handleErrorMessage, stableSort } from '../../utils/commonFunctions';
import styles from '../../stylesheets/InitiateParticipant.module.scss';
import moment from 'moment';
import { encodeData,isAuth } from '../../helpers/auth';
import API from '../../helpers/api';
import { toast } from 'react-toastify';
import { string } from 'joi';


const PaginationComponent = dynamic(() => import('../common/PaginationComponent'));

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  list: [],
};

export default function ParticipantCard(props) {
  const { 
    participants, 
    activeTab, 
    searchKey, 
    onTakeSurvey, 
    resumeSurvey, 
    loading, 
    formLists,  
  } = props;
  console.log(props);
  const [pagination, setPagination] = useState(initialPaginationState);
  const { activePage, skip, limitPerPage, paginatedData, list } = pagination;
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: '' });
  const type = {
    completed: 'Completed on',
    consented: 'Consented on',
    initiated: 'Initiated on',
  }
  
  const onPageChange = (page) => {
    var skipRecords = (page - 1) * limitPerPage;
    const to = limitPerPage * page;
    setPagination((prev) => ({
      ...prev,
      activePage: page,
      skip: skipRecords,
      paginatedData: list.slice(skipRecords, to),
    }));
  };

  useEffect(() => {
    onPageChange(activePage);
  }, [list, activePage]);

  useEffect(() => {
    const { order, orderBy } = sorter;
    let arr = stableSort(list, getComparator(order, orderBy));
    setPagination((prev) => ({ ...prev, list: arr }));
  }, [list?.length, sorter]);

  useEffect(() => {
    onPageChange(1);
  }, [list?.length]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, list: participants }));
  }, [participants?.length, participants]);

  useEffect(() => {
    handleFilter(string);
  }, [searchKey]);

  const handleFilter = () => {
    if (participants && participants.length) {
      let arr = participants.filter(
        (item) =>
          (searchKey ? item?.first_name?.toLowerCase().includes(searchKey.toLowerCase()) : true) ||
          (searchKey ? item?.last_name?.toLowerCase().includes(searchKey.toLowerCase()) : true) ||
          (searchKey ? item?.personal_email?.toLowerCase().includes(searchKey.toLowerCase()) : true) ||
          (searchKey ? item?.participant_id?.toLowerCase().includes(searchKey.toLowerCase()) : true)
      );
      setPagination((prev) => ({
        ...prev,
        list: searchKey ? [...arr] : participants,
      }));
    }
  };

  const handleSort = (name) => {
    setSorter((prev) => ({ orderBy: name, order: prev.orderBy === name && prev.order === 'asc' ? 'desc' : 'asc' }));
  };
  const resendSurvey = (payload) => {
    const encodePayload = encodeData(payload);
    API.apiPost('resendSurvey', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        console.log('err', err);
      });
  };

  const isParticipantFacing = (row) => {
    let found = formLists.find((form) => form?.name === row?.form_name && form?.form_code === row?.form_code);
    return found && found?.participant_facing ? true : false;
  };
  const onCopyLink = (surveyInfo) => {
    const date=Date.parse(surveyInfo.form_expire_at);
    const basePath = window.location.origin;
    const user = isAuth();
    const tokenInfo = {
      id: surveyInfo.id,
      form_name:surveyInfo.form_name,
      study_id: user.study_id,
      form_code:surveyInfo.form_code,
      form_group:surveyInfo.form_group,
      linkExp:date,
      personal_email:surveyInfo.personal_email
    };
    const link = basePath + `/e-consent?query=${encodeData(tokenInfo)}`;
    navigator.clipboard.writeText(link);
  }

  return (
    <>
      <div className="table-responsive">
        <Table hover className="data-table">
          <thead>
            <tr>
              <th className="ps-3">Sr. No.</th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('arm')}>
                  <span>Arm</span>
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('first_name')}>
                  <span>Participant Name</span>
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('participant_id')}>
                  <span>Participant ID</span>
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('Assignee')}>
                  <span>Assignee</span>
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('form_name')}>
                  {activeTab === 'initiated' && <span>Current Form</span>}
                  {activeTab === 'completed' && <span>Form Name</span>}
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              {activeTab === 'completed' && (
                <th>
                  <span className="alignTableHeading" onClick={() => handleSort('completed_On')}>
                    <span>Completed On</span>
                    <span className="ms-2">
                      <img src={'/images/sort.svg'} className="cursor-pointer" />
                    </span>
                  </span>
                </th>
              )}
              {activeTab !== 'completed' && (
                <th>
                  <span className="alignTableHeading" onClick={() => handleSort('Sent_date')}>
                    <span>Sent Date</span>
                    <span className="ms-2">
                      <img src={'/images/sort.svg'} className="cursor-pointer" />
                    </span>
                  </span>
                </th>
              )}
              {activeTab !== 'completed' && (
                <th>
                  <span className="alignTableHeading" onClick={() => handleSort('expiry_date')}>
                    <span>Expiry Date</span>
                    <span className="ms-2">
                      <img src={'/images/sort.svg'} className="cursor-pointer" />
                    </span>
                  </span>
                </th>
              )}
              {/* {activeTab === 'initiated' ? (
                <th>
                  <span className="alignTableHeading" onClick={() => handleSort('created_at')}>
                    <span>{type[activeTab]}</span>
                    <span className="ms-2">
                      <img src={'/images/sort.svg'} className="cursor-pointer" />
                    </span>
                  </span>
                </th>
              ) : (
                <th>
                  <span className="alignTableHeading" onClick={() => handleSort('updated_at')}>
                    <span>{type[activeTab]}</span>
                    <span className="ms-2">
                      <img src={'/images/sort.svg'} className="cursor-pointer" />
                    </span>
                  </span>
                </th>
              )}
              {['initiated', 'consented'].includes(activeTab) && <th></th>} */}
              {activeTab !== 'completed' && <th>{}</th>}
              {activeTab !== 'completed' && <th>{}</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData?.map((form, i) => (
              <tr key={i}>
                <td>{skip + i + 1}</td>
                <td>{form?.Arm?.name || '-'}</td>
                <td>{`${form?.first_name || '-'} ${form?.last_name || ''}`}</td>
                <td>{form?.participant_id || '-'}</td>
                <td>{`${form?.assigneeInfo?.first_name || '-'} ${form?.assigneeInfo?.last_name || ''}`} </td>
                <td className="text-break">{form?.form_name || '-'}</td>
                {activeTab === 'completed' && (
                  <td>{form?.completed_at ? moment(form?.completed_at).format('MM-DD-YYYY ; hh:mm') : '-'}</td>
                )}
                {activeTab !== 'completed' && (
                  <td>{form?.form_send_date ? moment(form?.form_send_date).format('MM-DD-YYYY ; hh:mm') : '-'}</td>
                )}
                {activeTab !== 'completed' && (
                  <td>{form?.form_expire_at ? moment(form?.form_expire_at).format('MM-DD-YYYY ; hh:mm') : '-'}</td>
                )}
                {activeTab === 'initiated' && (
                  <td>
                    <button
                      disabled={['Completed', 'Expired'].includes(form?.status)}
                      onClick={() => onTakeSurvey(form)}
                      className={`btn ${styles.takesurvey}`}
                    >
                      Take Survey
                    </button>
                  </td>
                )}
                {activeTab === 'consented' && (
                  <td>
                    <button
                      disabled={['Completed', 'Expired'].includes(form?.status)}
                      onClick={() => resumeSurvey(form)}
                      className={`btn text-white ${styles.resumesurvey}`}
                    >
                      Resume Survey
                    </button>
                  </td>
                )}
                {activeTab != 'completed' && (
                  <td>
                    <Dropdown className={styles.dropdownMenu}>
                      <Dropdown.Toggle
                        id="dropdown-basic"
                        data-toggle="tooltip"
                        title="View Actions"
                        className={`bg-white border-0 p-0 ${styles.toggleButton}`}
                      >
                        <img src={'/images/three-dot-icon.svg'} className="cursor-pointer mb-1 " />
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                      <Dropdown.Item 
                      onClick={() => onCopyLink(form)} className={styles.menuItems}>
                        Copy Link
                      </Dropdown.Item>
                        <Dropdown.Item
                          disabled={
                            ['Completed', 'Scheduled', 'Expired'].includes(form?.status) || !isParticipantFacing(form)
                          }
                          onClick={() => resendSurvey(form)}
                        >
                          Send survey link
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        {!list?.length && !loading && <div className="d-flex justify-content-center">No Records Found.</div>}
        {!!list?.length && (
          <div className="d-flex justify-content-end">
            <PaginationComponent
              currentPage={activePage}
              list={list}
              skip={skip}
              limitPerPage={limitPerPage}
              // loading={isLoading}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </>
  );
}
