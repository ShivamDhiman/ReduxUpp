import API from '../../helpers/api';
import { get } from 'lodash';
import { encodeData } from '../../helpers/auth';

function requestSurvey() {
  return {
    type: 'REQUEST_SURVEY',
  };
}

function errorSurvey(err) {
  let data = get(err, 'response.data', null);
  data = data || get(err, 'response');
  data = data || err;

  return (dispatch) => {
    dispatch({
      type: 'FAILURE_SURVEY',
      payload: err,
    });
  };
}

export function setSurvey() {
  return (dispatch) => {
    dispatch(requestSurvey());
    API.apiGet('survey', '/list')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_SURVEY`, payload: response.data.data });
        }
      })
      .catch((error) => {
        errorSurvey(error)(dispatch);
      });
  };
}

export function getIcfDetails(query) {
  return (dispatch) => {
    dispatch(requestSurvey());
    return API.apiGet('eicfDetails', query ? `?query=${encodeData(query)}` : '')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          return response.data.data
        }
      })
      .catch((error) => {
        errorSurvey(error)(dispatch);
      });
  };
}
