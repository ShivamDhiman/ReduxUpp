import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import Router from 'next/router';
import styles from '../../src/stylesheets/Common.module.scss';

const ParticipantPreview = dynamic(() => import('../../src/components/ParticipantManagement/Preview'), {
  loading: () => <LazyLoaderGeneral />,
});

const ParticipantView = (props) => {
  const { query } = props;
  const participant_id = query && query.id ? query.id : '';
  return (
    <Layout
      title={`Participant Management | RADxUP.`}
      data={{ layoutType: 'HOME' }}
      description={`RADxUp Participant management`}
    >
      <div className="container">
        <ParticipantPreview participant_id={participant_id} styles={styles} />
      </div>
    </Layout>
  );
};

ParticipantView.getInitialProps = async ({ store, query, isServer, pathname }) => {
  const participant_id = query && query.id ? query.id : '';
  if (!participant_id) process.browser && Router.push('/404');
  return { isServer, query, pathname };
};

export default ParticipantView;
