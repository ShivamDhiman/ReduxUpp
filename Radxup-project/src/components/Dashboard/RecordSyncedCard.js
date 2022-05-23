import { Placeholder } from 'react-bootstrap';
import { useSelector } from 'react-redux';

export default function RecordSyncedCard({ styles }) {
  const [surveyStats, loading] = useSelector((GState) => [GState.survey.surveyStats, GState.survey.loading]);

  return (
    <>
      <div className={`widget-card d-flex mr-2 ${styles.topStatCard}`}>
        <img src={'/images/pushed-record.svg'}></img>
        <div className="d-flex flex-column">
          <label className={`${styles.totalRecordText}`}>
            {loading ? (
              <Placeholder as="p" animation="glow" className="w-75">
                <Placeholder xs={4} />
              </Placeholder>
            ) : (
              surveyStats?.pushed
            )}
          </label>
          <label className={`${styles.topCardLabel}`}>Total records pushed</label>
        </div>
      </div>
    </>
  );
}
