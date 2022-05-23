import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { theme } from '../src/constants/theme';
import { Provider } from 'react-redux';
import { createWrapper } from 'next-redux-wrapper';
import App from 'next/app';
import store from '../src/store/index';
import reset from '../src//constants/css/reset';
import '../src/stylesheets/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'nprogress/nprogress.css';
// import '../src/stylesheets/index.scss';
// const GlobalStyle = createGlobalStyle`${reset}`;
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ManageProfile from '../src/components/common/ManageProfile';

class MyApp extends App {
  static async getStaticProps({ Component, ctx }) {
    getAppConfig();
    return {
      pageProps: {
        ...(Component.getInitialProps ? await Component.getInitialProps(ctx) : {}),
      },
    };
  }

  render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <Component {...pageProps} />
            <ManageProfile />
            {/* <GlobalStyle /> */}
            <ToastContainer />
          </Provider>
        </ThemeProvider>
      </>
    );
  }
}

const makeStore = () => store;
const wrapper = createWrapper(makeStore, { debug: false });

export default wrapper.withRedux(MyApp);
