import { useEffect, useState } from 'react';
import { Placeholder } from 'react-bootstrap';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';

export default function RecordSyncedCard({ styles }) {
  const [totalEnrolled, setTotalEnrolled] = useState(null);
  const [loading, setLoading] = useState(false);

  const getData = () => {
    setLoading(true);
    API.apiGet('syncedRecords')
      .then((response) => {
        if (response.data && response.data.success && response.data.data) {
          setTotalEnrolled(response.data.data.totalRecords);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <div className={`widget-card d-flex mr-2 ${styles.topStatCard}`}>
        <img src={'/images/total_record_sinced_icon.svg'}></img>
        <div className="d-flex flex-column">
          <label className={`${styles.totalRecordText}`}>
            {loading ? (
              <Placeholder as="p" animation="glow" className="w-75">
                <Placeholder xs={4} />
              </Placeholder>
            ) : (
              totalEnrolled
            )}
          </label>
          <label className={`${styles.topCardLabel}`}>Total number of records pushed</label>
        </div>
      </div>
    </>
  );
}
