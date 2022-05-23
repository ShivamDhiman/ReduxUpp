import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import IcfFormData from './IcfFormData';
import styles from '../../stylesheets/DataMgt.module.scss';
import { useReactToPrint } from 'react-to-print';

function IcfPdf() {
  const ref = useRef();
  const router = useRouter();
  const handlePdfDownload = useReactToPrint({
    content: () => ref.current,
  });
  
  const handleClose = () => {
    router.back();
  };

  return (
    <>
      <div className="row mb-2 d-flex">
        <div className="d-flex justify-content-end align-items-end">
          <div>
            <div>
              <button onClick={handleClose} className={`btn ${styles.buttonWidth} ${styles.buttonBackground} mx-1`}>
                Close
              </button>
              <button className={`btn ${styles.buttonWidth} mx-1 btn-primary`} onClick={handlePdfDownload}>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      <div ref={ref}>
        <IcfFormData />
      </div>
    </>
  );
}

export default IcfPdf;
