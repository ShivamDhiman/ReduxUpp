import API from '../../helpers/api';
import { get } from 'lodash';
import { encodeData } from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';

function requestEicf() {
  return {
    type: 'REQUEST_EICFS',
  };
}

function errorEicf(err) {
  let data = get(err, 'response.data', null);
  data = data || get(err, 'response');
  data = data || err;

  return (dispatch) => {
    dispatch({
      type: 'FAILURE_EICFS',
      payload: err,
    });
  };
}

export function setEicforms() {
  return (dispatch) => {
    dispatch(requestEicf());

    API.apiGet('eicfList')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_EICFS`, payload: response.data.data });
        }
      })
      .catch((error) => {
        errorEicf(error)(dispatch);
      });
  };
}

export function setEicformsPublished(data) {
  return (dispatch) => {
    dispatch(requestEicf());

    API.apiGet('eicfList', `?query=${data}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_EICFS_PUBLISHED`, payload: response.data.data });
        }
      })
      .catch((error) => {
        errorEicf(error)(dispatch);
      });
  };
}
export function getICFData(params) {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_ICF_CDE' });
    API.apiGet('eicfSelectedData', `?query=${params}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `SET_ICF_CDE`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        dispatch({ type: `SET_ICF_CDE`, payload: [] });
      });
  };
}
export function selectedRequiredCDEQuestion(oldCDE, selectedCDE) {
  return (dispatch) => {
    dispatch({ type: `SELECTED_REQUIRED_CDES`, payload: { oldCDE, selectedCDE } });
  };
}
