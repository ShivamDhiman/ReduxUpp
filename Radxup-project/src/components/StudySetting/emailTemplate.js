import React, { useEffect, useState } from 'react';
import { Button, Spinner, Table } from 'react-bootstrap';
import { getComparator, handleErrorMessage, stableSort } from '../../utils/commonFunctions';
import PaginationComponent from '../common/PaginationComponent';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { emailTemplates } from '../../store/actions/studyManagement';
import { useSelector, useDispatch } from 'react-redux';
import API from '../../helpers/api';
import { encodeData, isAuth } from '../../helpers/auth';
import ConfirmationModal from '../common/confirmationModal';
import moment from 'moment';

const initialPaginationState = {
  activePage: 1,
  skip: 0,
  limitPerPage: 5,
  paginatedData: [],
  userData: [],
  list: [],
};

const EmailTemplate = (props) => {
  const { styles } = props;
  const [pagination, setPagination] = useState(initialPaginationState);
  const [sorter, setSorter] = useState({ order: 'asc', orderBy: '' });
  const { activePage, skip, limitPerPage, paginatedData, list } = pagination;
  const [searchKey, setSearchKey] = useState('');
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});
  const [loadingForModal, setLoadingForModal] = useState(false);
  const userData = useSelector(({ user }) => user.userData) || isAuth();
  const [loading, emailTemplateData] = useSelector((Gstate) => [
    Gstate.studyManagement?.loading,
    Gstate.studyManagement?.emailTemplate,
  ]);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSort = (name) => {
    if (searchKey) {
      setSearchKey('');
      setPagination((prev) => ({
        ...prev,
        list: emailTemplateData,
      }));
    }
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

  useEffect(() => {
    onPageChange(activePage);
  }, [list, activePage]);

  useEffect(() => {
    const { order, orderBy } = sorter;
    let arr = stableSort(list, getComparator(order, orderBy));
    setPagination((prev) => ({ ...prev, list: arr, activePage: 1 }));
  }, [list.length, sorter]);

  useEffect(() => {
    onPageChange(1);
  }, [list.length]);

  useEffect(() => {
    dispatch(emailTemplates(userData?.study_id));
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, list: emailTemplateData }));
  }, [emailTemplateData?.length, emailTemplateData]);

  const deleteTemplateData = (data) => {
    const { id } = data;
    let template_id = id;
    const encodePayload = encodeData({ template_id });
    if (data.actionType === 'TemplateDelete') {
      API.apiPost('deleteTemplate', { payload: encodePayload })
        .then((response) => {
          if (response.data && response.data.success === true) {
            toast.success(response.data.message);
            dispatch(emailTemplates(userData?.study_id));
          }
        })
        .catch((err) => {
          console.log('err', err);
          handleErrorMessage(err);
        });
    }
    setShowModal(false);
  };

  const confirmAction = (id) => {
    let actionType = 'TemplateDelete';
    setPayloadData({
      actionType,
      id,
    });
    setShowModal(true);
  };

  const perviewTemplateData = (item) => {
    const { name, created_by, created_at, study_id, subject, body_content, header } = item;
    const encodeToken = encodeData({ name, created_by, created_at, study_id, subject, body_content, header });
    router.push(`/study-setting/${encodeToken}`);
  };

  const addTemplate = () => {
    router.push('/study-setting/templateForm');
  };

  return (
    <>
      {ShowModal && (
        <ConfirmationModal open={ShowModal} handleClose={deleteTemplateData} data={payloadData} loading={loadingForModal} />
      )}
      <div className="table-responsive">
        <Table hover className="data-table mb-3">
          <thead>
            <tr>
              <th className="ps-2">
                <span className="alignTableHeading" onClick={() => handleSort('name')}>
                  <span>Template Name</span>
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('created_by')}>
                  <span>Published By</span>
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th>
                <span className="alignTableHeading" onClick={() => handleSort('created_at')}>
                  <span>Published On</span>
                  <span className="ms-2">
                    <img src={'/images/sort.svg'} className="cursor-pointer" />
                  </span>
                </span>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData?.map((item, i) => (
              <tr key={i} className={styles.showdot}>
                <td className="ms-1" data-toggle="tooltip" title={item?.name}>
                  {item?.name}
                </td>
                <td>{`${item?.User?.first_name || '-'} ${item?.User?.last_name || ''}`}</td>
                <td>{item?.created_at ? moment(item?.created_at).format('MM-DD-YYYY') : '-'}</td>
                <td>
                  <img
                    src={'/images/eye.svg'}
                    data-toggle="tooltip"
                    title="View"
                    className="cursor-pointer px-4"
                    onClick={() => perviewTemplateData(item)}
                  />
                  <img
                    src={'/images/trash.svg'}
                    data-toggle="tooltip"
                    title="Delete"
                    onClick={() => confirmAction(item.id)}
                    className="cursor-pointer ms-4"
                  />
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

        <div>
          <Button className="d-flex justify-content-start btn-secondary " onClick={addTemplate}>
            Add New Template
          </Button>
        </div>
      </div>
    </>
  );
};

export default EmailTemplate;
