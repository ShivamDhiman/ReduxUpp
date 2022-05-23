import Router, { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import styles from '../../src/stylesheets/Forms.module.scss';

const FormAddEditComponent = dynamic(() => import('../../src/components/Forms/FormAddEdit'), {
  loading: () => <LazyLoaderGeneral />,
});

const InformedConsentForm = (props) => {
  const { query } = props;
  const router = useRouter();
  const pageName = query && query.id ? query.id : '';

  return (
    <Layout title={`Form management | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container">
        <FormAddEditComponent page={pageName} styles={styles} />
      </div>
    </Layout>
  );
};

InformedConsentForm.getInitialProps = async ({ store, query, isServer, pathname }) => {
  const pageName = query && query.id ? query.id : '';
  if (!pageName) process.browser && Router.push('/404');
  return { isServer, query, pathname };
};

export default InformedConsentForm;
