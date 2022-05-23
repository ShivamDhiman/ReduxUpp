import { get } from 'lodash';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';

function requestForms() {
  return {
    type: 'REQUEST_FORMS',
  };
}

function errorForms(err) {
  let data = get(err, 'response.data', null);
  data = data || get(err, 'response');
  data = data || err;

  return (dispatch) => {
    dispatch({
      type: 'FAILURE_FORMS',
      payload: err,
    });
  };
}

export function setForms() {
  return (dispatch) => {
    dispatch(requestForms());
    API.apiGet('forms')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_FORMS`, payload: response.data.data });
        }
      })
      .catch((error) => {
        errorForms(error)(dispatch);
        handleErrorMessage(error);
      });
  };
}
