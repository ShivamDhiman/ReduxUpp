import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Container, Row, Button, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { userConfig } from '../../constants/constant';
import { decryptedToken, login as LoginHelper, currentUser } from '../../helpers/auth';
import { getProfile } from '../../store/actions/user';
// import styles from '../../../src/stylesheets/Home.module.scss';

function SSOLoginComponent({ token }) {
  const [isLoading, setLoading] = useState(false);
  const userData = useSelector(({ user }) => user.userData);
  const router = useRouter();
  const dispatch = useDispatch();
  const originUrl = process.env.WEB_URL;

  useEffect(() => {
    let currentToken = currentUser();
    let Token = token || currentToken;
    if (decryptedToken(Token)) {
      LoginHelper(Token);
      setTimeout(() => {
        dispatch(getProfile());
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (userData && userData.role_id) {
      router.push(userConfig[userData.role_id]);
    }
  }, [userData]);

  const handleSsoLogin = () => {
    window.location.href = '/api/sso/login';
  };

  return (
    <div className="d-flex ms-4 mt-0 align-items-center">
      <div className={`d-flex d-nonex d-sm-blockx ${'loginLeftContent'}`}>
        <div className={`ms-4  my-auto ${'loginDescContainer'}`}>
          <p className={'loginDesc'}>
            <b>Colectiv</b> is a web-based electronic data capture platform for RADx-UP research teams to create and manage
            secure data collection forms, surveys, and electronic consent forms.
          </p>

          <p className={'loginDesc'}>
            The platform also comes preloaded with the NIH Tier 1 CDEs, a feature to securely transfer data to the RADx-UP
            CDCC, and an at-a-glance way to assess the progress of your study.
          </p>

          <p className={'loginDesc'}>
            To learn more about Colectiv, please contact your EIT or check visit our{' '}
            <a target="_blank" href="https://radx-up.org/colectiv/" className={'greenText'}>
              website
            </a>{' '}
            containing training materials, frequently asked questions, and more. You may also contact the Colectiv team at{' '}
            <a href="mailto:colectiv@duke.edu" target="_blank" className={'greenText'}>
              colectiv@duke.edu
            </a>{' '}
            for additional information or to request support.
          </p>
        </div>
      </div>
      <div className={`col-md d-flex ${'loginRightContent'}`}>
        <div className={'btnContainer'}>
          <div className={`d-flex justify-content-center flex-column mb-3 ${'logoContainer'}`}>
            <img src={'/images/final_color_logo1.svg'} className="mb-3"></img>
            <img src={'/images/mask-group.png'}></img>
          </div>
          <Button
            type="submit"
            className="mt-3 w-100 m-width"
            variant="primary"
            size="md"
            onClick={handleSsoLogin}
            disabled={isLoading}
          >
            SSO Login
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SSOLoginComponent;
