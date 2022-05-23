import { useEffect, useState } from 'react';
import { Placeholder, ProgressBar } from 'react-bootstrap';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';

const stars = [1, 2, 3, 4, 5];

export default function FeedbackCard({ styles }) {
  const [feedbackDetails, setFeedbackDetails] = useState({});
  const [loading, setLoading] = useState(false);

  async function getFeedback() {
    setLoading(true);
    API.apiGet('getFeedback')
      .then((response) => {
        if (response.data && response.data.success && response.data.data) {
          setFeedbackDetails(response.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        handleErrorMessage(err);
      });
  }

  useEffect(() => {
    getFeedback();
  }, []);

  const { allStars, TotalResponses, avgStars } = feedbackDetails;

  return (
    <>
      <div className={`widget-card d-flex ${styles.bottomStatCard} ${styles['survey-feeds']}`}>
        <div className="w-100 me-3">
          <div className={`d-flex flex-row flex-wrap justify-content-between`}>
            <label className={`${styles.mainTitle}`}>Feedback</label>
            <div className={`${styles.feedbackRatingArea} d-flex flex-row`}>
              <div className={`${styles.starAlignment}`}>
                {stars.map((star, i) => (
                  <img
                    key={i}
                    width={20}
                    height={21}
                    className={'mx-1'}
                    src={star <= avgStars ? '/images/favorite.svg' : '/images/starBlack.svg'}
                  />
                ))}
              </div>
              <p className={`${styles.ratingText}`}>{avgStars || 0} out of 5</p>
            </div>
          </div>

          <div className={`${styles.responseCount}`}>
            {TotalResponses} {TotalResponses > 1 ? 'Responses' : 'Response'}{' '}
          </div>

          <div className={`d-flex flex-column align-items-center`}>
            {!loading ? (
              allStars?.map((item, index) => (
                <div className={`d-flex`} key={index}>
                  <div className={`${styles.starTitle}`}>{item.average_rating} Star</div>
                  <div className={`${styles.FeedsBarSection} d-flex align-items-center`}>
                    <div
                      className={`${styles.Feedsprogress}`}
                      style={{ width: `${(item.cnt * 100) / TotalResponses}%` }}
                      key={index}
                    />
                    <div className={`${styles.responseTitle}`}>{item.cnt}</div>
                  </div>
                </div>
              ))
            ) : (
              <Placeholder as="p" animation="glow" className="w-75">
                {stars.map((item, inx) => (
                  <Placeholder xs={12} key={inx} item={item} />
                ))}
              </Placeholder>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
