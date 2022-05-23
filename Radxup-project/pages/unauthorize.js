import Layout from '../src/components/common/MainHeaderFooterLayout';

export default function UnAuthorize() {
  return (
    <Layout title={`UnAuthorize | RADxUP.`} data={{ layoutType: 'PAGE' }} description={`UnAuthorize`}>
      <div className="container text-center mt-5 ">
        <h2 className="mx-5 my-5">You do not have access to this page. Please contact your coordinator.</h2>
      </div>
    </Layout>
  );
}
