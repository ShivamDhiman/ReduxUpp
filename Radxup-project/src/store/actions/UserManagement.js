import API from '../../helpers/api';
import { encodeData } from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';

export function setUsers() {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_USERS' });
    API.apiGet('UserList')
      .then((response) => {
        if (response.data && response.data.status === true && response.data.data) {
          dispatch({ type: `SET_USERS`, payload: response.data.data });
        }
      })
      .catch((err) => {
        dispatch({ type: `SET_USERS`, payload: [] });
      });
  };
}
