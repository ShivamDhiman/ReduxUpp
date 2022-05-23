import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import styles from '../../src/stylesheets/ICForm.module.scss';

const EICaddEditComponent = dynamic(() => import('../../src/components/InformedConsentForm/EICaddEdit'), { ssr: false });

const InformedConsentForm = (props) => {
  const { query } = props;
  const router = useRouter();
  const pageName = query && query.id ? query.id : '';

  return (
    <Layout title={`Informed consent form | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container">
        <EICaddEditComponent page={pageName} styles={styles} />
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
