import { useEffect, useState } from 'react';
import { Placeholder } from 'react-bootstrap';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { Doughnut } from 'react-chartjs-2';

let data = {
  labels: ['Completed Surveys', 'Incomplete Surveys'],
  datasets: [
    {
      data: [100],
      backgroundColor: ['#00539B', '#4B9CD3'],
      hoverBackgroundColor: ['#00539B', '#4B9CD3'],
      borderWidth: 0,
    },
  ],
};

const options = {
  // plugins: {
  //   legend: {
  //     display: false,
  //   },
  // },
  legend: {
    display: false,
  },
  // cutout: 50,
  // borderAlign: 'inner',
  cutoutPercentage: 60,
  borderWidth: '9px',
  borderRadius: '40%',
  aspectRatio: 1,
  height: 204,
  width: 204,
  // responsive: false,
  // maintainAspectRatio: false,
};

export default function SurveyChartCard({ styles }) {
  const [details, setDetails] = useState({});
  const [graphData, setGraphData] = useState({ ...data });
  const [loading, setLoading] = useState(false);

  const getData = () => {
    setLoading(true);
    API.apiGet('surveyStats')
      .then((response) => {
        if (response.data && response.data.success && response.data.data) {
          const { totalRecords, completed } = response.data.data;
          setDetails(response.data.data);
          graphData.datasets[0].data = [completed, totalRecords - completed];
          setGraphData({ ...graphData });
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
      <div className={`widget-card d-flex ${styles.bottomStatCard} ${styles['survey-feeds']}`}>
        <div className="w-100">
          <div className={'d-flex justify-content-between'}>
            <label className={`${styles.mainTitle}`}>Survey</label>
            <label className={`${styles.totalSurvey}`}>
              Total Surveys
              <strong className={`${styles.surveyCount}`}>
                {loading ? (
                  <Placeholder animation="glow" className="w-75">
                    <Placeholder xs={4} />
                  </Placeholder>
                ) : (
                  details.totalRecords
                )}
              </strong>
            </label>
          </div>
          <div className={`${styles.chartArea}`}>
            <div className={`${styles.chartInfo}`}>
              {!loading && (
                <>
                  <div>
                    {isNaN(details.completed / details.totalRecords)
                      ? 0
                      : ((details.completed / details.totalRecords) * 100).toFixed()}
                  </div>
                  <div>% Completed</div>
                </>
              )}
            </div>
            {loading ? (
              <Placeholder as="p" animation="glow" className="w-75">
                {Array.from({ length: 5 }).map((item, inx) => (
                  <Placeholder key={inx} xs={12} />
                ))}
              </Placeholder>
            ) : (
              <div className="w-100 h-220">
                <Doughnut data={graphData} width={180} height={180} options={options} />
              </div>
            )}
          </div>
          <div className="d-flex justify-content-around">
            <div className="d-flex">
              <div className={`${styles.completedLegend}`}></div>
              <p className={`${styles.legendTitle}`}>Completed Surveys</p>
            </div>
            <div className="d-flex">
              <div className={`${styles.inCompleteLegend}`}></div>
              <p className={`${styles.legendTitle}`}>Incomplete Surveys </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
