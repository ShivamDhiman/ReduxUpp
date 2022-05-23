import { get } from 'lodash';
import API from '../../helpers/api';
import * as auth from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';

function errorRequest(err, dispatch) {
  let data = get(err, 'response.data', null);
  data = data || get(err, 'response');
  data = data || err;
  dispatch({
    type: 'REQUEST_FAIL',
    payload: data,
  });
}

// function requestStart() {
//   return {
//     type: 'REQUEST_START',
//   };
// }

export function login(payload) {
  return (dispatch) => {
    const type = 'AUTH';
    dispatch({ type: `${type}_REQUEST` });
    // dispatch(requestStart());

    try {
      API.apiPost('login', payload)
        .then(({ data }) => {
          if (data && data.token && data.status) {
            auth.login(data.token);
            dispatch({ type: `${type}_SUCCESS`, payload: data });
            setTimeout(() => {
              dispatch(getProfile());
            }, 500);
          }
        })
        .catch((err) => {
          errorRequest(err, dispatch);
          handleErrorMessage(err);
        });
    } catch (err) {
      errorRequest(err, dispatch);
    }
  };
}

export function SSOLogin(payload) {
  return (dispatch) => {
    const type = 'AUTH';
    dispatch({ type: `${type}_REQUEST` });

    try {
      API.apiGet('SSOLogin', payload)
        .then((resp) => {
          const { data } = resp;
          if (data && data.token && data.success) {
            auth.login(data.token);
          }
        })
        .catch((err) => {
          console.log(err);
          errorRequest(err, dispatch);
          handleErrorMessage(err);
        });
    } catch (err) {
      errorRequest(err, dispatch);
    }
  };
}

export function verifyOtp(payload) {
  return (dispatch) => {
    const type = 'AUTH';
    dispatch({ type: `${type}_REQUEST` });

    try {
      API.apiPost('verifyOtp', payload)
        .then((response) => {
          if (response.data && response.data.accessToken && response.data.status === 'SUCCESS') {
            auth.login(response.data.accessToken);
            dispatch({ type: `${type}_SUCCESS`, payload: response.data });
          }
        })
        .catch((err) => {
          errorRequest(err, dispatch);
        });
    } catch (err) {
      errorRequest(err, dispatch);
    }
  };
}

export function getProfile() {
  return (dispatch) => {
    const type = 'PROFILE';
    try {
      API.apiGet('profile')
        .then((response) => {
          if (response.data && response.data.data && response.data.status === true) {
            let payload = auth.decodeData(response.data.data);
            dispatch({ type: `${type}_SUCCESS`, payload });
          }
        })
        .catch((err) => {
          errorRequest(err, dispatch);
        });
    } catch (err) {
      errorRequest(err, dispatch);
    }
  };
}

export function logout() {
  return (dispatch) => {
    try {
      API.apiPost('logout', {});
    } catch (err) {
      errorRequest(err, dispatch);
    }
  };
}

export function getAppConfig() {
  API.apiGet('appConfig').then((response) => {
    if (response.data && response.data && response.data.success) {
      localStorage.setItem('appInfo', response.data.token);
    }
  });
}
