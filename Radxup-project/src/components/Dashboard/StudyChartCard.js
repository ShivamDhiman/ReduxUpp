import { useEffect, useState } from 'react';
import { Placeholder } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';

let data = {
  labels: ['', '', '', ''],
  type: 'bar',
  datasets: [
    {
      data: [],
      backgroundColor: ['#5AA3D2', '#14A9A2', '#F47F20', '#00539B'],
      hoverBackgroundColor: ['#5AA3D2', '#14A9A2', '#F47F20', '#00539B'],
      borderRadius: 50,
      barThickness: 16,
      maxBarThickness: 20,
      barPercentage: 1,
    },
  ],
};

const options = {
  // plugins: {
  //   legend: {
  //     display: false,
  //   },
  //   title: {
  //     position: 'left',
  //     display: false,
  //     text: 'Number of Studies',
  //   },
  // },
  legend: {
    display: false,
  },
  scales: {
    yAxes: [
      {
        scaleLabel: {
          display: false,
          // labelString: 'Y text',
        },
        ticks: {
          beginAtZero: true,
          fontSize: 14,
          stepSize: 10,
        },
        gridLines: {
          display: true,
        },
      },
    ],
    xAxes: [
      {
        scaleLabel: {
          display: false,
        },
        ticks: {
          fontSize: 14,
        },
        gridLines: {
          display: false,
          // showBorder: false,
          // color: '#ffffff',
        },
        barPercentage: 1.0,
        categoryPercentage: 1.0,
        barThickness: 16,
      },
    ],
  },
  cutout: 50,
  aspectRatio: 1,
  height: 274,
  // width: 174,
  responsive: true,
  maintainAspectRatio: false,
};

export default function SurveyChartCard({ styles }) {
  const [details, loading] = useSelector((GState) => [GState.studyManagement.studyStats, GState.studyManagement.loading]);
  const [graphData, setGraphData] = useState({ ...data });
  useEffect(() => {
    if (!loading && details?.TotalRecords) {
      let { Onboarding, Live, Paused, Completed } = details;
      graphData.datasets[0].data = [Onboarding, Live, Paused, Completed];
      setGraphData({ ...graphData });
      // data.datasets[0].data = [completed, totalRecords - completed];
    }
  }, [details, loading]);

  return (
    <>
      <div className={`widget-card d-flex ${styles.bottomStatCard} ${styles['survey-feeds']}`}>
        <div className="w-100">
          <div className={'d-flex justify-content-between'}>
            <label className={`${styles.mainTitle}`}>Study Status</label>
          </div>
          <div className={`${styles.chartArea} w-100`}>
            {loading ? (
              <Placeholder as="p" animation="glow" className="w-75">
                {Array.from({ length: 5 }).map((item, inx) => (
                  <Placeholder key={inx} xs={12} />
                ))}
              </Placeholder>
            ) : (
              <div className="d-flex align-items-center">
                <div className="defaultTextlabel">Number of Studies</div>
                <div className="w-100 h-220">
                  {!loading && <Bar data={graphData} width={300} options={options} style={{ width: '100%' }} />}
                </div>
              </div>
            )}
          </div>
          <div className="d-flex justify-content-around flex-wrap">
            <div className="d-flex">
              <div className={`${styles.onboarding}`}></div>
              <p className={`${styles.legendTitle}`}>Onboarding</p>
            </div>
            <div className="d-flex">
              <div className={`${styles.live}`}></div>
              <p className={`${styles.legendTitle}`}>Live</p>
            </div>
            <div className="d-flex">
              <div className={`${styles.paused}`}></div>
              <p className={`${styles.legendTitle}`}>Paused</p>
            </div>
            <div className="d-flex">
              <div className={`${styles.completed}`}></div>
              <p className={`${styles.legendTitle}`}>Completed</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
