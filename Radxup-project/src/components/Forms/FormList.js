import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Spinner } from 'react-bootstrap';

const FormCardComponent = dynamic(() => import('./FormCard'));
const PaginationComponent = dynamic(() => import('../common/PaginationComponent'));

export default function FormList({ type, searchKey, formList, loading }) {
  const initialPaginationState = {
    activePage: 1,
    skip: 0,
    limitPerPage: 5,
    paginatedData: [],
    list: formList,
  };
  const [pagination, setPagination] = useState(initialPaginationState);
  const { activePage, skip, limitPerPage, paginatedData, list } = pagination;

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
    onPageChange(activePage);
  }, [list, activePage]);

  useEffect(() => {
    if (formList) {
      setPagination((prev) => ({ ...prev, list: formList }));
    }
  }, [formList?.length, formList]);

  useEffect(() => {
    handleFilter();
  }, [searchKey]);

  const handleFilter = () => {
    if (formList && formList.length) {
      let arr = formList.filter((item) => (searchKey ? item.name?.toLowerCase().includes(searchKey.toLowerCase()) : true));
      setPagination((prev) => ({
        ...prev,
        list: [...arr],
      }));
    }
  };

  return (
    <>
      <div>
        {paginatedData.map((entry, i) => (
          <FormCardComponent key={i} {...entry} loading={loading} />
        ))}
      </div>
      {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="mt-5" />}
      <div className={`mt-5 d-flex justify-content-${list && !list.length ? 'center' : 'end'}`}>
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
