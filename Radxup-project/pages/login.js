import dynamic from 'next/dynamic';
import { parseCookies, setCookie, destroyCookie } from 'nookies';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import styles from '../src/stylesheets/Home.module.scss';

//const LoginComponent = dynamic(() => import('../src/components/common/LoginComponent'));
const SSOLoginComponent = dynamic(() => import('../src/components/common/SSOLogin'));

export default function Index({ cookies }) {
  const user = cookies?.token;
  return (
    <div className={styles.loginBackground}>
      <Layout title="Home | RADxUP." data={{ layoutType: 'PAGE', pageScreen: 'login' }} description="RADxUp Survey">
        <div className="container login-container text-center">
          <SSOLoginComponent token={user} styles={styles} />
        </div>
      </Layout>
      <div className={styles.setEllipse}>
        <img src={'/images/ellipse.svg'}></img>
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const cookies = parseCookies(ctx);
  destroyCookie(ctx, 'token');
  return { props: { cookies } };
}
