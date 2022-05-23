import Pagination from 'rc-pagination';
import 'rc-pagination/assets/index.css';
import localeInfo from 'rc-pagination/lib/locale/en_US';
import { Button } from 'react-bootstrap';
import styles from '../../stylesheets/Common.module.scss';
const PaginationComponent = ({ currentPage, skip, list, onPageChange, limitPerPage, loading }) => {
  return (
    <ul className={`pagination pull-right ${styles.paginationContainer}`}>
      {list && list.length ? (
        <Pagination
          onChange={onPageChange}
          current={currentPage}
          total={list.length}
          pageSize={limitPerPage}
          showLessItems
          // showTotal={(total, range) => `${range[0]} - ${range[1]} of ${total} items`}
          locale={localeInfo}
          nextIcon={
            <Button variant="light" className="btn btn-light btn-sm ">
              Next
            </Button>
          }
          prevIcon={
            <Button variant="light" className="btn btn-light btn-sm ">
              Previous
            </Button>
          }
        />
      ) : (
        !loading && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 'initial',
            }}>
            No Records Found.
          </div>
        )
      )}
    </ul>
  );
};
export default PaginationComponent;
