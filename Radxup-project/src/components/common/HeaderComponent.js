import Image from 'next/image';
import Link from 'next/link';
import { Container, Nav, Navbar, Dropdown } from 'react-bootstrap';
import { isAuth, logout } from '../../helpers/auth';
import styles from '../../stylesheets/Home.module.scss';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { SUPER_ADMIN_ROLE } from '../../../src/constants/constant';

export default function HeaderComponent({ isPublic, hasSideBar }) {
  const { questionData, submitSuccess } = useSelector((state) => state.survey);

  const userData = useSelector(({ user }) => user.userData) || {};
  const [studyInfo] = useSelector((GState) => [GState.studyManagement?.studyDetails]) || [];
  const router = useRouter();
  const pages = ['/login', '/'];
  const isNotSuperAdmin = userData.role_id !== SUPER_ADMIN_ROLE;
  const displayStudy = !pages.includes(router.pathname);
  const logoutUser = () => {
    logout();
  };

  return (
    <Navbar collapseOnSelect expand="lg" fixed="top" variant="dark" className={styles.bgGrey}>
      <Container fluid className="px-4">
        <Link href={'/'} passHref>
          <a className="navbar-link">
            <img src="/images/logo.svg" alt="Logo" />
          </a>
        </Link>
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mx-auto">
            {displayStudy && (
              <>
                <span
                  className={`${styles.textBlue} ${styles.font24} ${styles.headerText} fw-bold ${
                    !hasSideBar ? styles.mainArrow : ''
                  }`}
                >
                  {isNotSuperAdmin && (userData?.study_name || studyInfo?.name)}
                  {/* 'Study Name' */}
                </span>
                <div className={styles.arrowDown}></div>
              </>
            )}
          </Nav>
          {/* !isPublic */}
          {Object.keys(userData).length || submitSuccess ? (
            <Nav>
              <Dropdown className={styles.dropdownMenu}>
                <Dropdown.Toggle
                  id="dropdown-basic"
                  data-toggle="tooltip"
                  title="Logout"
                  className={`border-0 p-0 ${styles.toggleButton}`}
                >
                  <img src="/images/UserGroup.svg" alt="Logo" />
                  <span className="text-dark p-2 fw-bold">
                    {userData && `${userData.first_name || ''} ${userData.last_name || ''}`}
                  </span>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end">
                  <Dropdown.Item className={styles.menuItems} onClick={logoutUser}>
                    <img src="/images/logout_icon.png" alt="Logo" className="cursor-pointer me-2" />
                    <span>Logout</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          ) : (
            <img src="/images/UserGroup.svg" hidden={!isAuth()} alt="Logo" />
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
