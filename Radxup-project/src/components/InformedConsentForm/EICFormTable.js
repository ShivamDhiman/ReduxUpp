import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import moment from 'moment';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { Pagination, Table, Dropdown, Spinner } from 'react-bootstrap';
import { setEicforms } from '../../store/actions/eicforms';
import styles from '../../stylesheets/ICForm.module.scss';
import { encodeData } from '../../helpers/auth';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import { handleErrorMessage, getComparator, stableSort } from '../../utils/commonFunctions';
import ConfirmationModal from '../common/confirmationModal';

const PaginationComponent = dynamic(() => import('../common/PaginationComponent'));

export default function EICFormTable({ type, searchKey, setSearchKey, ecifList, loading }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});
  const [loadingForModal, setLoadingForModal] = useState(false);

  const initialPaginationState = {
    activePage: 1,
    skip: 0,
    limitPerPage: 5,
    paginatedData: [],
    ecifData: [],
    list: ecifList,
  };
  const [pagination, setPagination] = useState(initialPaginationState);
  const { activePage, skip, limitPerPage, paginatedData, ecifData, list } = pagination;

  const onPageChange = (page) => {
    var skipRecords = (page - 1) * limitPerPage;
    const to = limitPerPage * page;
    setPagination({
      ...pagination,
      activePage: page,
      skip: skipRecords,
      paginatedData: list.slice(skipRecords, to),
    });
  };

  useEffect(() => {
    let arr = stableSort(list, getComparator(order, orderBy));
    setPagination((prev) => ({ ...prev, list: arr }));
  }, [list.length, order, orderBy]);

  useEffect(() => {
    onPageChange(activePage);
  }, [list, activePage]);

  useEffect(() => {
    onPageChange(1);
  }, [list.length]);

  useEffect(() => {
    if (ecifList) {
      setPagination((prev) => ({ ...prev, list: ecifList }));
    }
  }, [ecifList?.length, ecifList]);

  useEffect(() => {
    handleFilter();
  }, [searchKey]);

  const handleFilter = () => {
    if (ecifList && ecifList.length) {
      let arr = ecifList.filter((item) => (searchKey ? item.name?.toLowerCase().includes(searchKey.toString().toLowerCase()) : true));
      setPagination((prev) => ({
        ...prev,
        list: [...arr],
      }));
    }
  };

  const onHandleCloseAction = (data) => {
    if (!data) {
      setShowModal(false);
      return;
    }
    setLoadingForModal(true);
    const { actionType, name, version } = data;
    let apikey,
      payload = { name, version };
    actionType === 'delete' ? (apikey = 'deleteEICF') : (apikey = 'eICFUpdateStatus');
    if (actionType === 'archive') {
      payload = { ...payload, status: 'Archive' };
    }
    const encodePayload = encodeData(payload);
    API.apiPost(apikey, { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setShowModal(false);
          toast.success(response.data.message);
          dispatch(setEicforms());
          setLoadingForModal(false);
        }
      })
      .catch((err) => {
        console.log('err', err);
        handleErrorMessage(err);
        setLoadingForModal(false);
      });
  };
  const editFormData = (item, isNewVersion) => {
    const { name, version, language, status, category } = item;
    const encodeToken = encodeData({
      name,
      version,
      language,
      status,
      preview: false,
      createVersion: isNewVersion,
      category,
    });
    router.push(`/informed-consent-form/${encodeToken}`);
  };

  const perviewFormData = (item) => {
    const { name, version, language, status } = item;
    const encodeToken = encodeData({ name, version, language, status, preview: true });
    router.push(`/informed-consent-form/${encodeToken}`);
  };

  const handleSort = (name) => {
    setSearchKey('');
    setOrderBy(name);
    setOrder((prev) => (orderBy === name && prev === 'asc' ? 'desc' : 'asc'));
  };

  const confirmAction = (data, actionType) => {
    setSearchKey('');
    const { version, name, status } = data;
    setPayloadData({
      actionType,
      version,
      name,
      status,
    });
    setShowModal(true);
  };

  return (
    <>
      {ShowModal && (
        <ConfirmationModal open={ShowModal} handleClose={onHandleCloseAction} data={payloadData} loading={loadingForModal} />
      )}
      <div className={`table-responsive ${styles.disableScroll}`}>
        <Table className="data-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('name')}>
                  <span className="ms-1">ICF Name</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('category')}>
                  <span className="ms-1">Form Type</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('languageList')}>
                  <span className="ms-1">Language</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('version')}>
                  <span className="ms-1">IRB Version No.</span>
                  <span className="ms-1">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                {type === 'archives' ? 'Archive Date ' : type === 'published' ? 'Published Date' : 'Last Updated Date'}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((entry, i) => (
              <tr key={i}>
                <td>{i + skip + 1}</td>
                <td>{entry?.name}</td>
                <td>{entry?.category}</td>
                <td>{entry?.languageList}</td>
                <td>{`IRB ${entry?.version}`}</td>
                <td>{moment(entry?.updated_at).format('MM-DD-YYYY')}</td>
                {entry?.status == 'Draft' && (
                  <td>
                    <div className="d-flex justify-content-around">
                      <img
                        src={'/images/edit.svg'}
                        data-toggle="tooltip"
                        title="Edit"
                        className="cursor-pointer mx-4"
                        onClick={() => editFormData(entry, false)}
                      />
                      <img
                        src={'/images/trash.svg'}
                        data-toggle="tooltip"
                        title="Delete"
                        className="cursor-pointer mx-4"
                        onClick={() => confirmAction(entry, 'delete')}
                      />
                    </div>
                  </td>
                )}
                {entry?.status === 'Archive' && (
                  <td>
                    <img
                      src={'/images/eye.svg'}
                      data-toggle="tooltip"
                      title="View"
                      className="cursor-pointer mx-4"
                      onClick={() => perviewFormData(entry)}
                    />
                  </td>
                )}
                {entry?.status === 'Published' && (
                  <td>
                    <div className="d-flex justify-content-around">
                      <img
                        src={'/images/eye.svg'}
                        data-toggle="tooltip"
                        title="View"
                        onClick={() => perviewFormData(entry)}
                        className="cursor-pointer px-4"
                      />
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
                          <Dropdown.Item className={styles.menuItems} onClick={() => editFormData(entry, 'newVersion')}>
                            Create New Version
                          </Dropdown.Item>
                          <Dropdown.Item className={styles.menuItems} onClick={() => confirmAction(entry, 'archive')}>
                            Archive
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
      <div className={`d-flex justify-content-${list && !list.length ? 'center' : 'end'}`}>
        <PaginationComponent
          currentPage={activePage}
          list={list}
          skip={skip}
          limitPerPage={limitPerPage}
          loading={loading}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
}
