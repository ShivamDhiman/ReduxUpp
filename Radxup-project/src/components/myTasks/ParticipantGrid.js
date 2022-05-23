import moment from 'moment-timezone';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import _ from 'lodash';
import { encodeData,isAuth  } from '../../helpers/auth';
import styles from '../../stylesheets/InitiateParticipant.module.scss';
import { getComparator, handleErrorMessage, stableSort } from '../../utils/commonFunctions';
import { getFullName } from '../../utils/commonFunctions';
const PaginationComponent = dynamic(() => import('../common/PaginationComponent'));

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 6,
  paginatedData: [],
  list: [],
};
export default function ParticipantGrid(props) {
  const { participants, activeTab, searchKey, onTakeSurvey, resumeSurvey, loading, formLists } = props;
  const [pagination, setPagination] = useState(initialPaginationState);
  const { activePage, skip, limitPerPage, paginatedData, list } = pagination;
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: '' });

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
    setPagination((prev) => ({ ...prev, list: participants }));
  }, [participants?.length, participants]);

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
    handleFilter();
  }, [searchKey]);

  const handleFilter = () => {
    if (participants && participants?.length) {
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
    const found = formLists?.find((form) => form?.name === row?.form_name && form?.form_code === row?.form_code);
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
      <div className="row">
        {paginatedData?.map((data, index) => (
          <div className="col-md-4 my-2" key={index}>
            <div className="card-deck">
              <div className={`card card-with-shadow`}>
                <div className={`card-body ${styles.gridLayout}`}>
                  <div
                    className="col-md-12 d-flex justify-content-start "
                    data-toggle="tooltip"
                    title={`${data?.first_name || ''} ${data?.last_name || ''}`}
                  >
                    <div className="col-md-7 d-flex justify-content-start align-items-center ">
                      <label className={`text-center ${styles.title} my-1 `}>
                        {/* {getFullName(data?.first_name || '', data?.last_name || '')} */}
                        {`${data?.first_name || '-'} ${data?.last_name || ''}`}
                      </label>
                    </div>
                    <div className="col-md-5 d-flex justify-content-between">
                      <div>
                        {activeTab !== 'completed' && (
                          <button
                            disabled={['Completed', 'Expired'].includes(data?.status)}
                            onClick={() => onTakeSurvey(data)}
                            className={`btn ${styles.takesurvey}`}
                          >
                            Take Survey
                          </button>
                        )}
                      </div>
                      <div>
                        {activeTab !== 'completed' && (
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
                            <Dropdown.Item onClick={() => onCopyLink(data)} className={styles.menuItems}>
                               Copy Link
                             </Dropdown.Item>
                              <Dropdown.Item
                                disabled={
                                  ['Completed', 'Scheduled', 'Expired'].includes(data?.status) || !isParticipantFacing(data)
                                }
                                onClick={() => resendSurvey(data)}
                              >
                                Send survey link
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </div>
                      {activeTab === 'consented' && (
                        <button
                          disabled={['Completed', 'Expired'].includes(data?.status)}
                          onClick={() => resumeSurvey(data)}
                          className={`btn text-white ${styles.resumesurvey}`}
                        >
                          Resume Survey
                        </button>
                      )}
                    </div>
                  </div>
                  <div className=" d-flex align-items-start" data-toggle="tooltip" title={data?.form_name || ''}>
                    <label className={`d-flex justify-content-start ${styles.formName} my-1`}>Arm</label>{' '}
                    <label className={`${styles.values} my-1 mx-1`}>{_.get(data?.Arm) || '-'}</label>{' '}
                  </div>
                  <div className=" d-flex align-items-start" data-toggle="tooltip" title={data?.participant_id}>
                    <label className={`${styles.formName} my-1`}>Participant ID</label>
                    <label className={`${styles.values} my-1 mx-1`}>{data?.participant_id || '-'}</label>
                  </div>
                  <div className=" d-flex align-items-start " data-toggle="tooltip" title={data?.form_name}>
                    <label className={`d-flex justify-content-start ${styles.formName} my-1`}>Assignee</label>{' '}
                    <label className={`${styles.values} my-1 mx-1`}>{`${data?.assigneeInfo?.first_name || '-'} ${
                      data?.assigneeInfo?.last_name || ''
                    }`}</label>{' '}
                  </div>
                  <div
                    className="d-flex align-items-start justify-content-start "
                    data-toggle="tooltip"
                    title={data?.form_name}
                  >
                    <label className={`d-flex justify-content-start me-1 ${styles.formName} my-1`}>Current Form</label>{' '}
                    <label className={`${styles.data} my-1 d-flex justify-content-start align-items-start`}>
                      {data?.form_name || '-'}
                    </label>{' '}
                  </div>
                  {/* <div className=" d-flex align-items-start " data-toggle="tooltip" title="Personal Email">
                    <img src={'/images/email.svg'} heigh="30" width="30" className="pe-2 my-1" />
                    <label className={`${styles.values} my-1 mx-1`}>{data?.personal_email || '-'}</label>
                  </div>
                  <div
                    className=" d-flex align-items-start "
                    data-toggle="tooltip"
                    title={activeTab === 'consented' ? 'consented' : activeTab === 'completed' ? 'completed' : 'initiated'}
                  >
                    <img src={'/images/calendar.svg'} heigh="30" width="30" className="pe-2 my-1" />
                    <label className={`${styles.values} my-1 mx-1`}>
                      {moment(data?.updated_at).format('MM-DD-YYYY') || '-'}
                    </label>
                  </div> */}

                  <div className=" d-flex align-items-start " data-toggle="tooltip" title={data?.form_name}>
                    <label className={`d-flex justify-content-start ${styles.formName} my-1`}>Send Date</label>{' '}
                    <label className={`${styles.values} my-1 mx-1`}>
                      {data?.form_send_date ? moment(data?.form_send_date).format('MM-DD-YYYY') : '-'}
                    </label>
                  </div>
                  <div className=" d-flex align-items-start " data-toggle="tooltip" title={data?.form_name}>
                    <label className={`d-flex justify-content-start ${styles.formName} my-1`}>Expiry Date</label>{' '}
                    <label className={`${styles.values} my-1 mx-1`}>
                      {data?.form_expire_at ? moment(data?.form_expire_at).format('MM-DD-YYYY') : '-'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row  mt-5">
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
