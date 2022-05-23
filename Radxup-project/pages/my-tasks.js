import dynamic from 'next/dynamic';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../src/components/common/LazyLoaderComponent';
import { ADMIN_ROLE } from '../src/constants/constant';
import { useSelector } from 'react-redux';
import { isAuth } from '../src/helpers/auth';

const MyParticipantComponent = dynamic(() => import('../src/components/myTasks'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function MyParticipant() {
  const userData = useSelector(({ user }) => user.auth);
  const user = isAuth() || userData;
  return (
    <Layout title={`My Participant  | RADxUP.`} data={{ layoutType: 'HOME' || 'PAGE' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <MyParticipantComponent />
      </div>
    </Layout>
  );
}
