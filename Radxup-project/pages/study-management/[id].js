import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import Router, { useRouter } from 'next/router';
import styles from '../../src/stylesheets/Study.module.scss';

const AddEditComponent = dynamic(() => import('../../src/components/StudyManagement/addEdit'), {
  loading: () => <LazyLoaderGeneral />,
});

const StudyManagementAddEdit = (props) => {
  const { query } = props;
  const pageName = query && query.id ? query.id : '';
  const studyId = query && query.search ? query.search : '';
  return (
    <Layout title={`Study Management | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Study management`}>
      <div className="container">
        <AddEditComponent page={pageName} studyId={studyId} styles={styles} />
      </div>
    </Layout>
  );
};

StudyManagementAddEdit.getInitialProps = async ({ store, query, isServer, pathname }) => {
  const pageName = query && query.id ? query.id : '';
  if (!pageName) process.browser && Router.push('/404');
  return { isServer, query, pathname };
};

export default StudyManagementAddEdit;
