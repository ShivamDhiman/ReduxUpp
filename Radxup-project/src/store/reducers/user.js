import { isAuth } from '../../helpers/auth';

const INITIAL_STATE = {
  auth: {},
  isOtp: false,
  errors: {},
  userData: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'AUTH_FAILURE':
      return { ...state, errors: action.payload };
    case 'AUTH_SUCCESS':
      return { ...state, auth: action.payload, isOtp: false, userData: isAuth() };
    case 'PROFILE_SUCCESS':
      return { ...state, userData: action.payload, isOtp: false };
    case 'OTP_RECEIVED':
      return { ...state, isOtp: true };
    default:
      return state;
  }
};
