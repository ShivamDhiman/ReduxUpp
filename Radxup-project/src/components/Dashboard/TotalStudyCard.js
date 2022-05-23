import { useEffect } from 'react';
import { Placeholder } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getStudiesData } from '../../store/actions/studyManagement';

export default function TotalStudyCard({ styles }) {
  const [studyStats, loading] = useSelector((GState) => [GState.studyManagement.studyStats, GState.studyManagement.loading]);
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(getStudiesData());
  }, []);

  return (
    <>
      <div className={`widget-card d-flex mr-2 ${styles.topStatCard}`}>
        <img src={'/images/studies.svg'}></img>
        <div className="d-flex flex-column">
          {loading ? <Placeholder xs={3} /> : <label className={`${styles.averageTimeText}`}>{studyStats?.TotalRecords}</label>}
          <label className={`${styles.topCardLabel}`}>Total number of studies</label>
        </div>
      </div>
    </>
  );
}
