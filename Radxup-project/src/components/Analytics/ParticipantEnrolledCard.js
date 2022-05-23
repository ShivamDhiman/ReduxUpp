import { useEffect, useState } from 'react';
import { Placeholder } from 'react-bootstrap';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';

export default function ParticipantEnrolledCard({ styles }) {
  const [totalEnrolled, setTotalEnrolled] = useState(null);
  const [loading, setLoading] = useState(false);

  const getData = () => {
    setLoading(true);
    API.apiGet('participantsEnrolled')
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
        <img src={'/images/participant_enrolled-icon.svg'}></img>
        <div className="d-flex flex-column">
          <label className={`${styles.totalParticipantText}`}>
            {loading ? (
              <Placeholder as="p" animation="glow" className="w-75">
                <Placeholder xs={4} />
              </Placeholder>
            ) : (
              totalEnrolled
            )}
          </label>
          <label className={`${styles.topCardLabel}`}>Total participants enrolled</label>
        </div>
      </div>
    </>
  );
}
