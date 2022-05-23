import dynamic from 'next/dynamic';
import { Form, InputGroup, Modal, Pagination, Table, Dropdown, Button, FormGroup } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
import styles from '../../stylesheets/DataMgt.module.scss';
import { getComparator, handleErrorMessage, stableSort } from '../../utils/commonFunctions';
import PaginationComponent from '../common/PaginationComponent';
import _ from 'lodash';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import ExportModal from './ExportModal';
import { WithAuth } from '../common/WithAuth';
import { useDispatch, useSelector } from 'react-redux';
import { encodeData, isAuth } from '../../helpers/auth';
import { useRouter } from 'next/router';
import { COORDINATOR_ROLE, SyncStatusKey } from '../../constants/constant';
import { setSurvey } from '../../store/actions/dataManagement';
import { clearFormData, fetchSurveyData } from '../../store/actions/survey';
import { setFormLists } from '../../store/actions/participants';
import API from '../../helpers/api';
import { toast } from 'react-toastify';

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  userData: [],
  list: [],
};
export default WithAuth(function DataManagement() {
  const [loading, surveyList] = useSelector((Gstate) => [Gstate.dataManagement?.loading, Gstate.dataManagement?.surveyList]);
  const [formLists] = useSelector((Gstate) => [Gstate.participants?.formListData]);
  const user = isAuth();
  const isCordinator = [COORDINATOR_ROLE].includes(user.role_id);
  const dispatch = useDispatch();
  const router = useRouter();
  const csvRef = useRef();
  const [searchKey, setSearchKey] = useState('');
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: '' });
  const [checkedRecords, setChcekedRecords] = useState([]);
  const [fileName, setFileName] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [pagination, setPagination] = useState(initialPaginationState);
  const [type, setType] = useState('ALL');
  const [heads, setHeads] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [showEICFModal, setShowEICFModal] = useState(false);
  const [EICFList, setEICFList] = useState([]);
  const [selectedICF, setSelectedICF] = useState(null);
  const [selectedSurveyDetails, setSelectedSurveyDetails] = useState(null);
  const [fromDownload, setFromDownload] = useState(false);
  const prevStatusRef = useRef();
  const sync_statuses = prevStatusRef.current;
  const { activePage, skip, limitPerPage, paginatedData, list } = pagination;

  useEffect(() => {
    prevStatusRef.current = surveyList?.map((item) => item.sync_status);
  });

  useEffect(() => {
    dispatch(setSurvey());
    dispatch(setFormLists('DataManagement'));
  }, []);

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
  }, [list, activePage, limitPerPage]);

  useEffect(() => {
    const { order, orderBy } = sorter;
    let arr = stableSort(surveyList, getComparator(order, orderBy));
    setPagination((prev) => ({ ...prev, list: arr }));
  }, [sorter]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, list: surveyList }));
  }, [surveyList.length, surveyList]);

  useEffect(() => {
    setChcekedRecords([]);
  }, [searchKey]);

  const checkIsHybrid = (data) => {
    let formGrps = [...new Set(data?.SurveyDetails?.map((item) => item.form_group))];
    return formGrps;
  };

  const viewFormData = (data) => {
    dispatch(clearFormData());
    let tokenInfo = {
      personal_email: data.personal_email,
      form_code: data.form_code,
      form_name: data.form_name,
      form_group: data.form_group,
      survey_id: data.id,
      participant_id: data?.User?.participant_id,
      study_id: data?.study_id,
      user_id: data?.user_id,
      completed_at: data?.completed_at,
      form_group: data.form_group,
    };
    const encodeToken = encodeData(tokenInfo);
    router.push(`/data-management/${encodeToken}`);
  };

  const viewICF = (data) => {
    if (!data?.id || !data?.form_code) {
      return;
    }
    if (!fromDownload) {
      let tokenInfo = {
        is_icf_form: true,
        survey_id: data.id,
        form_code: data.form_code,
        form_group: 'eICF',
        version: data.version || selectedSurveyDetails?.version,
        completed_at: data.completed_at || selectedSurveyDetails?.completed_at,
        user_id: data.user_id || selectedSurveyDetails?.user_id,
        participant_id: data.participant_id || selectedSurveyDetails?.User?.participant_id,
      };
      const encodeToken = encodeData(tokenInfo);
      router.push(`/data-management/${encodeToken}`);
    } else {
      downloadEICF(selectedSurveyDetails);
      let payload = {
        ...selectedSurveyDetails,
        form_group: 'eICF',
        form_code: data?.form_code,
      };
      getSurveyData(payload);
    }
    setShowEICFModal(false);
  };

  const getEicfList = (formCodes) => {
    let payload = [...formCodes];
    API.apiGet(`getEicfList`, payload ? `?query=${encodeData(payload)}` : '')
      .then((res) => {
        setEICFList(
          res?.data?.data?.map((item) => ({
            form_code: item.form_code,
            name: item.name,
            survey_id: selectedSurveyDetails.id,
          }))
        );
        setShowEICFModal(true);
      })
      .catch((err) => {
        handleErrorMessage(err);
      });
  };

  const viewIcfFormData = (data) => {
    dispatch(clearFormData());
    setSelectedSurveyDetails(data);
    let formCodes = [
      ...new Set(data?.SurveyDetails?.filter((item) => item.form_group === 'eICF').map((item) => item.form_code)),
    ];
    if (formCodes.length > 1) {
      getEicfList(formCodes);
      return;
    }
    viewICF({
      id: data.id,
      form_code: formCodes[0],
      user_id: data.user_id,
      completed_at: data.completed_at,
      version: data.version,
      participant_id: data?.User?.participant_id,
    });
  };

  const getSurveyData = (data) => {
    const { User } = data;
    const currentDate = moment(new Date()).format('MM/DD/YYYY');
    const UID = User?.UID ? User.UID : '';

    let payload = {
      survey_id: data.id,
      form_group: data.form_group,
      form_code: data.form_code,
      action: 'download',
    };
    let completed_at = moment(data.completed_at).format('MM/DD/YYYY hh:mm');
    setFileName(`${data.form_name || ''}_${UID}_${currentDate || ''}`);
    const encodePayload = encodeData(payload);
    dispatch(fetchSurveyData(encodePayload)).then((list) => {
      if (Array.isArray(list) && list.length) {
        let tempData = {
          'RECORD ID': data.id,
        };
        list.forEach((item) => {
          tempData[item.variable_name] = item.value || item.answer;
        });
        tempData = {
          ...tempData,
          sociodem_date_mdy: completed_at,
          housing_date_mdy: completed_at,
          work_ppe_date_mdy: completed_at,
          med_hx_date_mdy: completed_at,
          hlthstat_date_mdy: completed_at,
          vacc_date_mdy: completed_at,
          test_date_mdy: completed_at,
          sym_date_mdy: completed_at,
          alcohol_date_mdy: completed_at,
          iden_date_mdy: completed_at,
          consentdt_mdy: completed_at,
          covid_test_date_mdy: completed_at,
        };
        let heads = Object.keys(tempData).map((item) => ({ label: item?.toUpperCase(), key: item }));
        setHeads(heads);
        setCsvData([tempData]);
        setFromDownload(false);
        csvRef?.current?.click();
      }
    });
  };

  const downloadForm = (data) => {
    data = {
      ...data,
      form_group: 'Form',
      form_code: data.form_code,
    };
    getSurveyData(data);
  };

  const downloadEICF = (data) => {
    let formCodes = [
      ...new Set(data?.SurveyDetails?.filter((item) => item.form_group === 'eICF').map((item) => item.form_code)),
    ];
    setSelectedSurveyDetails(data);
    if (formCodes.length > 1) {
      setFromDownload(true);
      getEicfList(formCodes);
      return;
    }
    data = {
      ...data,
      form_group: 'eICF',
      form_code: formCodes[0],
    };
    getSurveyData(data);
  };

  const exportFormData = () => {
    setSearchKey('');
    handleShow();
  };

  const handleClose = () => {
    setShowExportModal(false);
    setShowEICFModal(false);
  };
  const handleShow = () => setShowExportModal(true);

  const onChangeHandler = (e) => {
    setSearchKey(e.target.value);
  };

  const onSelectEICF = (e) => {
    let survey_id = EICFList[0]?.survey_id;
    setSelectedICF({ form_code: e.target?.value, survey_id });
  };

  const handleSearch = (e) => {
    let searchvalue = e.target.value;
    let arr = surveyList.filter(
      (item) =>
        (searchvalue ? item.form_name?.toLowerCase().includes(searchvalue.toLowerCase()) : true) ||
        (searchvalue ? item.participant_id?.toLowerCase().includes(searchvalue.toLowerCase()) : true)
    );

    setPagination((prev) => ({
      ...prev,
      list: arr,
    }));
  };

  const handleSort = (name) => {
    setSorter((prev) => ({ orderBy: name, order: prev.orderBy === name && prev.order === 'asc' ? 'desc' : 'asc' }));
  };

  const pushSyncRecords = () => {
    if (checkedRecords && checkedRecords.length) {
      let selectedIds = checkedRecords.map((item) => item.id);
      let encodePayload = encodeData(selectedIds);
      API.apiPost(`syncRecords`, { payload: encodePayload })
        .then((res) => {
          dispatch(setFormLists());
          dispatch(setSurvey());
          setChcekedRecords([]);
          toast.success(res.data.message);
        })
        .catch((err) => {
          handleErrorMessage(err);
        });
    }
  };

  const handleSyncFilter = (statusType) => {
    setType(statusType);
    if (searchKey) {
      setSearchKey('');
    }
    setPagination((prev) => ({
      ...prev,
      list: statusType !== 'ALL' ? surveyList.filter((form) => [statusType].includes(form.sync_status)) : surveyList,
    }));
  };

  const handleSelectRecords = (event, record, isAllSelected) => {
    const {
      target: { checked },
    } = event;

    isAllSelected && checked ? setChcekedRecords(list) : setChcekedRecords([]);
    if (record && checked) {
      let found = checkedRecords.filter((rec) => rec.id === record.id);
      !found.length ? setChcekedRecords([...checkedRecords, record]) : '';
    } else if (record && !checked) {
      setChcekedRecords(checkedRecords.filter((rec) => rec.id !== record.id));
    }
  };

  const isChecked = (id) => {
    if (id) {
      return checkedRecords.filter((rec) => rec.id == id).length;
    } else {
      const selectedIds = checkedRecords.map((rec) => rec.id);
      const allDataIds = list.map((rec) => rec.id);
      return _.isEqual(_.sortBy(selectedIds), _.sortBy(allDataIds)) && selectedIds.length;
    }
  };

  const setTypeFilter = ({ target: { value } }) => {
    handleSyncFilter(value);
  };

  const handleSyncSwitchFilter = (event) => {
    if (event.target.checked) {
      handleSyncFilter('PUSH_REQUIRED');
    } else {
      handleSyncFilter('ALL');
    }
  };

  return (
    <>
      <Modal
        className="custom-modal"
        show={showExportModal}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        centered
      >
        <ExportModal formLists={formLists} handleClose={handleClose}></ExportModal>
      </Modal>
      <Modal className="custom-modal" show={showEICFModal} onHide={handleClose} backdrop="static" keyboard={false} centered>
        <div className="p-4">
          <FormGroup>
            <label className="form-label text-dark fw-bold">Select EICF</label>
            <Form.Select
              value={selectedICF?.form_code}
              name="form_code"
              className="form-select"
              aria-label="Default select form"
              onChange={onSelectEICF}
            >
              <option hidden>Please select EICF</option>
              {EICFList.map((item, i) => (
                <option key={i} value={item.form_code}>
                  {item.name}
                </option>
              ))}
            </Form.Select>
          </FormGroup>
          <div className="text-center">
            <Button variant="secondary" size="md" className="mt-3" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="mt-3 ms-2"
              onClick={() => viewICF({ id: selectedICF?.survey_id, form_code: selectedICF?.form_code })}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
      {heads && heads.length ? (
        <CSVLink headers={heads} data={csvData} filename={`${fileName}.csv`}>
          <button ref={csvRef} className="d-none"></button>
        </CSVLink>
      ) : null}
      {!isCordinator && (
        <div className="row mb-4 justify-content-end data-table-header">
          <div className="col-md-3">
            <div className={`d-flex ${styles.cstCheckbox}  justify-content-around align-items-center`}>
              <label className="form-check-label font-weight-bold mr-4 text-start">
                View Only <br /> Push Required Data
              </label>
              <div className="form-check form-switch pb-2">
                <input
                  className="form-check-input"
                  onChange={handleSyncSwitchFilter}
                  type="checkbox"
                  id="flexSwitchCheckDefault"
                  checked={type === 'PUSH_REQUIRED'}
                />
              </div>
            </div>
          </div>
          <div className="col-md-5 d-flex justify-content-end">
            <button className="btn btn-primary mx-1 primary-button-bg" onClick={exportFormData}>
              Export Form Data
            </button>
            <button className="btn btn-primary ms-1 primary-button-bg" onClick={pushSyncRecords}>
              Push Selected Records
            </button>
          </div>
        </div>
      )}
      <div className="d-flex align-items-end col-md-12  mb-4 justify-content-between">
        <div className="col-md-2  justify-content-start me-2">
          <label className={`my-2 mx-2 ${styles.typeLable}`}>Status</label>
          <Form.Select className="form-select " value={type} onChange={setTypeFilter} aria-label="Default select form">
            <option value="ALL">All</option>
            <option value="PUSH_REQUIRED">Push Required</option>
            <option value="PUSHED">Pushed</option>
          </Form.Select>
        </div>
        <div className="col-md-3" onChange={onChangeHandler}>
          <InputGroup className="search-input">
            <input
              placeholder="Search..."
              type="text"
              className="form-control"
              name="searchKey"
              value={searchKey}
              maxLength="15"
              onChange={handleSearch}
            />
            <div className="search-icon cursor-pointer">
              <img src={'/images/search_icon.svg'}></img>
            </div>
          </InputGroup>
        </div>
      </div>
      <div className="table-responsive">
        <Table hover className="data-table">
          <thead>
            <tr>
              {!isCordinator && (
                <th>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      checked={isChecked()}
                      onChange={(e) => handleSelectRecords(e, null, true)}
                      type="checkbox"
                      value=""
                      id="flexCheckDefault"
                    />
                  </div>
                </th>
              )}
              <th>Sr. No.</th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('fromName')}>
                  <span>Form Name</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>Participant ID</th>
              <th>Status &nbsp;</th>
              <th>Last Updated Date</th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((entry, i) => (
              <tr key={i}>
                {!isCordinator && (
                  <td>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        checked={isChecked(entry.id)}
                        onChange={(e) => handleSelectRecords(e, entry)}
                        type="checkbox"
                        id={'flexCheckDefault' + entry.srNo}
                      />
                    </div>
                  </td>
                )}
                <td>{i + skip + 1}</td>
                <td>{entry.form_name}</td>
                <td>{entry.User?.participant_id}</td>
                <td>{SyncStatusKey[entry?.sync_status]?.lable}</td>
                <td>{moment(entry.updated_at).format('MM-DD-YYYY')}</td>
                <td className="dropdownArrowshow">
                  <Dropdown drop="start">
                    <Dropdown.Toggle className={`bg-transparent border-0 p-0 remove-arrow ${styles.toggleButton}`}>
                      <img src={'/images/eye.svg'} className="cursor-pointer" />
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {checkIsHybrid(entry).includes('Form') && (
                        <Dropdown.Item onClick={() => viewFormData(entry)}>View Data Form</Dropdown.Item>
                      )}
                      {checkIsHybrid(entry).includes('eICF') && (
                        <Dropdown.Item onClick={() => viewIcfFormData(entry)}>View ICF Form</Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
                <td>
                  {/* {['PUSH_REQUIRED'].includes(entry.sync_status) && (
                    <img src={'/images/alert_error_icon.svg'} className="cursor-pointer" />
                  )} */}
                </td>
                {!isCordinator && (
                  <td className="dropdownArrowshow">
                    <Dropdown drop="start">
                      <Dropdown.Toggle className={`bg-transparent border-0 p-0 ${styles.toggleButton}`}>
                        <img src={'/images/download_icon.svg'} className="cursor-pointer" />
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        {checkIsHybrid(entry).includes('Form') && (
                          <Dropdown.Item onClick={() => downloadForm(entry)}>Download Data Form</Dropdown.Item>
                        )}
                        {checkIsHybrid(entry).includes('eICF') && (
                          <Dropdown.Item onClick={() => downloadEICF(entry)}>Download ICF Form</Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {!list.length && <div className="d-flex justify-content-center">No Records Found.</div>}
      {!!list.length && (
        <div className="d-flex justify-content-end">
          <PaginationComponent
            currentPage={activePage}
            list={list}
            skip={skip}
            limitPerPage={limitPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
});
