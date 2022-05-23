import Document, { Html, Head, Main, NextScript } from 'next/document';
// import flush from 'styled-jsx/server';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const { html, head, errorHtml, chunks } = ctx.renderPage();
    // const styles = flush();
    return { ...initialProps, html, head, errorHtml, chunks }; //styles
  }

  render() {
    return (
      <Html
        lang="en-us"
        class="no-js"
        itemscope=""
        itemtype="//schema.org/Webpage"
        xmlns="http://www.w3.org/1999/xhtml"
        xmlnsOg="https://ogp.me/ns#"
        xmlnsFb="http://ogp.me/ns/fb#"
      >
        <Head>
          <meta charSet="UTF-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta httpEquiv="Cache-control" content="public" />
          <link rel="icon" href="/favicon.ico" id="favicon" />

          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#00539b" />
          <meta name="msapplication-tap-highlight" content="no" />

          <meta property="og:type" content="survey" />
          <meta property="og:image:width" content="600" />
          <meta property="og:image:height" content="300" />

          <link rel="manifest" href="manifest.json" />
          <meta name="robots" content="index,follow" />
          <meta name="theme-color" content="#00539b" />
        </Head>
        <body>
          {this.props.customValue}

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
