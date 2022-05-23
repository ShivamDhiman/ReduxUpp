import { Spinner, Table } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
import styles from '../../stylesheets/DataMgt.module.scss';
import { getComparator, stableSort } from '../../utils/commonFunctions';
import PaginationComponent from '../common/PaginationComponent';
import _ from 'lodash';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import { useDispatch, useSelector } from 'react-redux';
import { encodeData, isAuth } from '../../helpers/auth';
import { useRouter } from 'next/router';
import { COORDINATOR_ROLE, SyncStatusKey } from '../../constants/constant';
import { toast } from 'react-toastify';
import axios from 'axios';
import apiKeys from '../../helpers/api/apiKeys';

const Axios = axios.create({
  baseURL: 'https://radxup-dev.azurewebsites.net/api/',
});

Axios.defaults.headers.common.authorization =
  process.browser &&
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkeV9pZCI6MSwiaWQiOjUsInJvbGVfaWQiOjEsImV4cCI6MTY1MDYxMjg5NiwiaWF0IjoxNjQ4MDIwODk2fQ._NzYPUgWyQfj_vDgsiTwI_yCrVVhRlUv-TUvLkbcBhc';

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  userData: [],
  list: [],
};
export default function DataManagement() {
  const [loading, surveyList] = useSelector((Gstate) => [Gstate.dataManagement?.loading, Gstate.dataManagement?.surveyList]);
  const user = isAuth();
  const isCordinator = [COORDINATOR_ROLE].includes(user.role_id);
  const dispatch = useDispatch();
  const router = useRouter();
  const csvRef = useRef();
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: '' });
  const [checkedRecords, setChcekedRecords] = useState([]);
  const [fileName, setFileName] = useState('');
  const [pagination, setPagination] = useState(initialPaginationState);
  const [heads, setHeads] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const prevStatusRef = useRef();
  const { activePage, skip, limitPerPage, paginatedData, list } = pagination;

  useEffect(() => {
    prevStatusRef.current = surveyList?.map((item) => item.sync_status);
  });

  function getData(){
    Axios.get(`survey/list`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_SURVEY`, payload: response.data.data });
        }
      })
      .catch((error) => {});
  }
  useEffect(() => {
    getData();
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
  }, []);

  const downloadSurveyData = (data) => {
    let payload = {
      survey_id: data.id,
      action: 'download',
    };
    let completed_at = moment(data.completed_at).format('MM/DD/YYYY hh:mm');
    setFileName(data.form_name);
    const encodePayload = encodeData(payload);
    Axios.get(`${apiKeys.surveyDetails}?query=${encodePayload}`).then((res) => {
      if (Array.isArray(res?.data?.data) && res.data.data.length) {
        let tempData = {
          'RECORD ID': data.id,
        };
        res.data.data.forEach((item) => {
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
        csvRef?.current?.click();
      }
    });
  };

  const handleDownloadBundle = () => {
    let ids = checkedRecords.map(item => item.id);
    if(!ids.length || loadingBundle){
      return;
    }
    let payload = {
      ids: ids,
    };
    const encodePayload = encodeData(payload);
    setLoadingBundle(true);
    Axios.get(`${apiKeys.surveyBundle}?query=${encodePayload}`)
    .then((res) => {
      getData();
      saveJSON(res?.data?.data, `bundle_${moment().format('YYYY-MM-DDThh:mm:ss-ssss')}.json`);
      setLoadingBundle(false);
      // toast.success('Record(s) Pushed Successfully.');
    })
    .catch((err) => {
      setLoadingBundle(false);
      toast.error(err?.response?.data?.message);
    });
  };

  function saveJSON(data, filename) {
    if (!data) {
      console.error('No data');
      return;
    }
    if (!filename) filename = `bundle_${moment().format('YYYY-MM-DDThh:mm:ss-ssss')}.json`;

    if (typeof data === 'object') {
      data = JSON.stringify(data, undefined, 4);
    }

    var blob = new Blob([data], { type: 'text/json' }),
      e = document.createEvent('MouseEvents'),
      a = document.createElement('a');

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
  }

  const handleSort = (name) => {
    setSorter((prev) => ({ orderBy: name, order: prev.orderBy === name && prev.order === 'asc' ? 'desc' : 'asc' }));
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

  return (
    <>
      {heads && heads.length ? (
        <CSVLink headers={heads} data={csvData} filename={`${fileName}.csv`}>
          <button ref={csvRef} className="d-none"></button>
        </CSVLink>
      ) : null}
      <div className="col-md-12 mb-2 d-flex justify-content-end">
        <button className="btn btn-primary mx-1 primary-button-bg" onClick={handleDownloadBundle}>
          Export&nbsp;
          {loadingBundle && <Spinner animation="border" size='sm' />}
        </button>
        <button className="btn btn-secondary mx-1 primary-button-bg" disabled>
          Push Selected Records
        </button>
      </div>
      <div className="table-responsive">
        <Table hover className="data-table">
          <thead>
            <tr>
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
                        disabled={entry?.sync_status === 'PUSHED'}
                        type="checkbox"
                        id={'flexCheckDefault' + entry.srNo}
                      />
                    </div>
                  </td>
                )}
                <td>{i + skip + 1}</td>
                <td>{entry.form_name}</td>
                <td>{entry.participant_id}</td>
                <td>{SyncStatusKey[entry?.sync_status]?.lable}</td>
                <td>{moment(entry.updated_at).format('MM-DD-YYYY')}</td>
                {!isCordinator && (
                  <td>
                    <img
                      src={'/images/download_icon.svg'}
                      className="cursor-pointer"
                      onClick={() => downloadSurveyData(entry)}
                    />
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
}
