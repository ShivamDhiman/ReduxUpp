import { useEffect } from 'react';
import { Placeholder } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getSyncedRecords } from '../../store/actions/survey';

export default function ParticipantEnrolledCard({ styles }) {
  const [surveyStats, loading] = useSelector((GState) => [GState.survey.surveyStats, GState.survey.loading]);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getSyncedRecords())
  }, []);

  return (
    <>
      <div className={`widget-card d-flex mr-2 ${styles.topStatCard}`}>
        <img src={'/images/collected-Record.svg'}></img>
        <div className="d-flex flex-column">
          <label className={`${styles.totalParticipantText}`}>
            {loading ? (
              <Placeholder as="p" animation="glow" className="w-75">
                <Placeholder xs={4} />
              </Placeholder>
            ) : (
              surveyStats?.totalRecords
            )}
          </label>
          <label className={`${styles.topCardLabel}`}>Total records collected</label>
        </div>
      </div>
    </>
  );
}
