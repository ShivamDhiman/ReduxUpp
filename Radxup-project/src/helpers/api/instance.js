import axios from 'axios';

// const HOST = 'https://radxup-dev.azurewebsites.net';
const HOST = 'https://radxup-cde-dev.azurewebsites.net';
const VERSION = '/api/';
const API = HOST + VERSION;

const instance = axios.create({
  baseURL: API,
});

export default instance;
