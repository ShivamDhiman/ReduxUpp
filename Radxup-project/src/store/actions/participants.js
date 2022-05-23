import API from '../../helpers/api';
import { encodeData } from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';

export function setParticipants(fromMyTasks) {
  const query = fromMyTasks ? '?userFormMappingType=all' : '';
  return (dispatch) => {
    dispatch({ type: 'REQUEST_PARTICIPANTS' });
    API.apiGet('participantList', query)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `SET_PARTICIPANTS`, payload: response.data.data });
        }
      })
      .catch((err) => {
        dispatch({ type: `SET_PARTICIPANTS`, payload: [] });
      });
  };
}

export function setFormLists(For) {
  return (dispatch) => {
    const encodePayload = encodeData({ status: 'Published', language: 'English', has_dependency: false, for: For });
    dispatch({ type: 'REQUEST_FORM_LIST' });
    API.apiGet('participantForms', `?query=${encodePayload}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `SET_FORMLIST`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        dispatch({ type: 'SET_FORMLIST', payload: [] });
      });
  };
}

export function setMangersLists() {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_MANGERS' });
    API.apiGet('managersList')
      .then((response) => {
        // console.log('response.data', response.data);
        if (response.data && response.data.status === true && response.data.data) {
          dispatch({ type: `SET_MANGERS`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        dispatch({ type: `SET_MANGERS`, payload: [] });
      });
  };
}
