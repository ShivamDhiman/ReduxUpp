import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import styles from '../../src/stylesheets/ICForm.module.scss';
import { decodeData } from '../../src/helpers/auth';
import IcfPdf from '../../src/components/DataManagement/IcfPdf';

const DataManagementEditComponent = dynamic(() => import('../../src/components/DataManagement/DataManagementEdit'), {
  ssr: true,
});

const InformedConsentForm = (props) => {
  const { query } = props;
  const router = useRouter();
  const pageName = query && query.id ? query.id : '';
  const decoded = decodeData(pageName);

  return (
    <Layout title={`Data Managment form | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container">
        {decoded?.is_icf_form && <IcfPdf page={pageName} />}
        {!decoded?.is_icf_form && <DataManagementEditComponent page={pageName} styles={styles} />}
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
