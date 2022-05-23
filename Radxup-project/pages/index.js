import dynamic from 'next/dynamic';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import styles from '../src/stylesheets/Home.module.scss';

const LoginComponent = dynamic(() => import('../src/components/common/LoginComponent'));
const SSOLoginComponent = dynamic(() => import('../src/components/common/SSOLogin'));

export default function Index() {
  return (
    <div className={`${styles.loginBackground}`}>
      <Layout title="Home | RADxUP." data={{ layoutType: 'PAGE', pageScreen: 'login' }} description="RADxUp Survey">
        <div className="container login-container text-center">
          <LoginComponent styles={styles} />
          {/* <SSOLoginComponent /> */}
        </div>
      </Layout>
      <div className={styles.setEllipse}>
        <img src={'/images/ellipse.svg'}></img>
      </div>
    </div>
  );
}
