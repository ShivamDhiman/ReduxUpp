import decode from 'jwt-decode';
import { Base64 } from 'js-base64';
import { setAuthorization } from './api/index';

export function getLanguage() {
  return localStorage.getItem('appLang');
}

export function setLanguage(lang) {
  return localStorage.setItem('appLang', lang);
}

export function getToken() {
  if (process.browser) {
    return localStorage.getItem('accessToken');
  }
  return '';
}

export const encodeData = (payload) => {
  try {
    let dataString = Base64.btoa(JSON.stringify(payload));
    return dataString;
  } catch (error) {
    return null;
  }
};

export const decodeData = (token) => {
  try {
    let payload = JSON.parse(Base64.atob(token));
    return payload;
  } catch (error) {
    return null;
  }
};

export function decryptedToken(token) {
  try {
    return decode(token);
  } catch (err) {
    return false;
  }
}

export function makeWebId(length) {
  const result = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }
  return result.join('');
}

export function currentUser() {
  return localStorage.getItem('accessToken');
}

export function isAuth() {
  try {
    const tokenChecked = localStorage.getItem('accessToken');
    if (tokenChecked) {
      return decryptedToken(tokenChecked);
    }
    return false;
  } catch (err) {
    return false;
  }
}

export function login(token, appId = '') {
  localStorage.setItem('accessToken', token);
  localStorage.setItem('appId', appId);
  setAuthorization();
  return true;
}

export function setRemember(user = {}) {
  localStorage.setItem('userRemember', JSON.stringify(user || isAuth()));
  return true;
}

export function removeRemember() {
  localStorage.removeItem('userRemember');
  return true;
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('appId');
  setAuthorization();
  setTimeout(() => {
    if (process.browser) window.location.href = `${window.location.origin}/`;
  }, 500);
  return true;
}
