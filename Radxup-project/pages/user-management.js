import dynamic from 'next/dynamic';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../src/components/common/LazyLoaderComponent';
import styles from '../src/stylesheets/Common.module.scss';

const UserManagementComponent = dynamic(() => import('../src/components/UserManagement/index'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function UserManagement() {
  return (
    <Layout title={`User Management | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <UserManagementComponent styles={styles} />
      </div>
    </Layout>
  );
}
