import HeaderComponent from './HeaderComponent';
import FooterComponents from './FooterComponent';
import Head from 'next/head';
import NProgress from 'nprogress';
import Router, { useRouter } from 'next/router';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import Sidebar from './SidebarComponent';
import styles from '../../stylesheets/Home.module.scss';
import { decodeData, getToken } from '../../helpers/auth';
import { useSelector } from 'react-redux';
import { SUPER_ADMIN_ROLE, ADMIN_ROLE, COORDINATOR_ROLE } from '../../constants/constant';

/**
 * loader progress-bar
 **/
NProgress.configure({ easing: 'ease', speed: 500, trickleSpeed: 2000, showSpinner: false });
Router.onRouteChangeStart = (url) => {
  // if (url === '/' || url === '/home') {
  NProgress.start();
  // }
};
Router.onRouteChangeComplete = () => NProgress.done();
Router.onRouteChangeError = () => NProgress.done();

const MainHeaderFooterLayout = ({ children, title, data, description, isPublic }) => {
  const router = useRouter();
  const userData = useSelector(({ user }) => user.userData) || {};
  const user = decodeData(getToken());
  const hasSideBarLayout = data && data.layoutType === 'HOME';
  const isloggedInSidebar = [ADMIN_ROLE, COORDINATOR_ROLE].includes(userData?.role_id);
  const hasSideBar = hasSideBarLayout || isloggedInSidebar;
  const pages = ['/initiate-participant', '/survey', '/e-consent/[id]'];
  const displayHomeButton = pages.includes(router.pathname) && user?.role_id === COORDINATOR_ROLE;
  const notLoginScreen = data?.pageScreen !== 'login';

  const redirectToParticipant = () => {
    router.push('/initiate-participant');
  };
  return (
    <React.Fragment>
      <Head>
        <title>{title || 'RADxUP.'}</title>
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="title" content={title} />
        <meta name="description" content={description} />

        <meta itemProp="name" content={title} />
        <meta itemProp="description" content={description} />
      </Head>
      {data?.pageScreen != 'login' && <HeaderComponent isPublic={isPublic} hasSideBar={hasSideBar} />}
      {!hasSideBar && displayHomeButton && (
        <Row className={` mt-4`}>
          <Col md={2} className={styles.sidebarWrapper}>
            <button className="btn btn-primary ms-2" onClick={redirectToParticipant}>
              Home
            </button>
          </Col>
        </Row>
      )}

      <Row className={styles['margin-right-0']}>
        {notLoginScreen && hasSideBar && (
          <Col md={2} className={styles.sidebarWrapper}>
            <Sidebar />
          </Col>
        )}
        <Col
          md={(hasSideBar && 10) || 12}
          xs={12}
          className={`${styles.pageContentWrapper} ${hasSideBar || !displayHomeButton ? '' : 'mt-0'}`}
        >
          {children}
        </Col>
      </Row>
      <FooterComponents />
    </React.Fragment>
  );
};

export default MainHeaderFooterLayout;
