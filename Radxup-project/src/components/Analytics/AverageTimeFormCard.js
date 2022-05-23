import { useEffect, useState } from 'react';
import { Placeholder } from 'react-bootstrap';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';

export default function AverageTimeFormCard({ styles }) {
  const [loading, setLoading] = useState(false);
  const [avgTime, setAvgTime] = useState('');

  const getAvgTime = () => {
    setLoading(true);
    API.apiGet('avgTime')
      .then((response) => {
        if (response.data && response.data.success) {
          let averageTime = response.data.data;
          if(parseFloat(averageTime) < 0) {
            averageTime = 0;
          }
          setAvgTime(`${averageTime?.toFixed(2)} min`);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  useEffect(() => {
    getAvgTime();
  }, []);

  return (
    <>
      <div className={`widget-card d-flex mr-2 ${styles.topStatCard}`}>
        <img src={'/images/average_time_form_icon.svg'}></img>
        <div className="d-flex flex-column">
        <label className={`${styles.averageTimeText }`}>
            {loading ? (
              <Placeholder as="p" animation="glow" className="w-75">
                <Placeholder xs={4} />
              </Placeholder>
            ) : (
              avgTime
            )}
          </label>
          {/* {loading ? <Placeholder xs={3} /> : <label className={`${styles.averageTimeText}`}>{avgTime}</label>} */}
          <label className={`${styles.topCardLabel}`}>Average time taken to fill the form</label>
        </div>
      </div>
    </>
  );
}
