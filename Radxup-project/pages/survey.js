import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../src/components/common/MainHeaderFooterLayout';

const SurveyFormsComponent = dynamic(() => import('../src/components/Survey/SurveyForm'));

const Survey = () => {
  return (
    <Layout title={`Survey form | RADxUP.`} description={`RADxUp Survey`} isPublic={true}>
      <div className="container text-center">
        <SurveyFormsComponent />
      </div>
    </Layout>
  );
};

export default Survey;
