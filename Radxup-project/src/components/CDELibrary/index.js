import { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { setCDEQuestions, formatCDEQuestions } from '../../store/actions/CDEQuestions';
import API from '../../helpers/api';
import { WithAuth } from '../common/WithAuth';

import CDEDetailsModal from './CDEDetailsModal';

const CDELibrary = ({ styles }) => {
  const dispatch = useDispatch();
  const [CDEListLoading, CDElibrary] = useSelector((Gstate) => [Gstate.CDEList?.loading, Gstate?.CDEList?.CDElibrary]);
  const [cdeDetails, setCdeDetails] = useState();
  const [openDetailModal, setOpenDetailsModal] = useState(false);
  const [sections, setSections] = useState([]);

  //question attribute label
  // linked variable name
  // add child icon along with variable_name aligned right
  useEffect(() => {
    dispatch(setCDEQuestions());
  }, []);

  useEffect(() => {
    let maCDEList = CDElibrary?.map((section) => {
      let uniqueVariables = [...new Set([...section?.CDEQuestions.map((q) => q?.variable_name)])];
      let uniqueSectionQuestions = [];
      uniqueVariables?.forEach((variable) => {
        let foundQue = section?.CDEQuestions?.find((que) => que?.variable_name == variable);
        if (foundQue) {
          let englishQuestions = section?.CDEQuestions.filter(
            (que) => que?.language === 'English' && foundQue?.variable_name == que?.variable_name
          );
          let spanishQuestions = section.CDEQuestions.filter(
            (que) => que?.language === 'Spanish' && foundQue?.variable_name == que?.variable_name
          );

          let englistAdult = englishQuestions.find(
            (que) => que?.category === 'Adult' && foundQue?.variable_name == que?.variable_name
          );
          let englistPeadiatric = englishQuestions.find(
            (que) => que?.category === 'Pediatric' && foundQue?.variable_name == que?.variable_name
          );
          let spanishAdult = spanishQuestions.find(
            (que) => que?.category === 'Adult' && foundQue?.variable_name == que?.variable_name
          );
          let spanishPeadiatric = spanishQuestions.find(
            (que) => que?.category === 'Pediatric' && foundQue?.variable_name == que?.variable_name
          );
          let queData = {
            English: {
              Adult: englistAdult,
              Peadiatric: englistPeadiatric,
              question_type: 'CDE Question',
              cde_id: englistAdult?.id,
            },
            Spanish: {
              Adult: spanishAdult,
              Peadiatric: spanishPeadiatric,
              question_type: 'CDE Question',
              cde_id: englistAdult?.id,
            },
            cde_id: englistAdult?.cde_id || englistAdult?.id,
            cde_idEnglish: englistAdult?.id,
            cde_idSpanish: spanishAdult?.id,
            required: !englistAdult?.required,
            study_mapped: !englistAdult?.study_mapped,
            variable_name: variable,
            linked_variable_name: englistAdult?.linked_variable_name,
            labelEnglish: englistAdult?.question,
            labelSpanish: spanishAdult?.question,
            question_attributes_label: englistAdult?.question_attributes_label,
          };
          uniqueSectionQuestions.push(queData);
        }
      });

      // section.CDEQuestions.forEach((que) => {
      //   if (que.childrens) {
      //     sectionQuestions = [...sectionQuestions, ...que.childrens];
      //   }
      // });

      // let uniqueVariables = [...new Set([...sectionQuestions.map((q) => q.variable_name)])];
      // let uniqueSectionQuestions = [];
      // uniqueVariables.forEach((variable) => {
      //   let foundQue = sectionQuestions.find((que) => que.variable_name == variable);
      //   if (foundQue) {
      //     uniqueSectionQuestions.push(foundQue);
      //   }
      // });
      section.CDEQuestions = uniqueSectionQuestions;
      return section;
    });
    setSections(maCDEList);
  }, [CDElibrary?.length]);

  const handleSelectRecords = (event, record, isAllSelected) => {
    const {
      target: { checked },
    } = event;
  };

  const toggleSection = (index) => {
    let _sectionList = [...sections];
    _sectionList[index] = { ..._sectionList[index], expand: _sectionList[index].expand ? false : true };
    setSections([..._sectionList]);
  };

  return (
    <div className="sectionContainer">
      {cdeDetails && (
        <CDEDetailsModal
          details={cdeDetails}
          handleClose={() => {
            setCdeDetails(null);
            setOpenDetailsModal(false);
          }}
          open={openDetailModal}
        />
      )}

      {sections.map(
        (item, index) =>
          !!item?.CDEQuestions.length && (
            <div key={index} className={`card mb-2 ${styles.cdeCard}`}>
              <div className={`d-flex justify-content-between p-3`}>
                <div className={`${styles.sectionTitle} ps-2`}>{`SECTION ${index + 1}: ${item?.name}`}</div>
                <div className={` ${styles.sectionToggle}`}>
                  <img
                    src={item.expand ? '/images/up-arrow.svg' : '/images/down-arrow.svg'}
                    data-toggle="tooltip"
                    title="Expand"
                    className="cursor-pointer mx-2"
                    onClick={() => toggleSection(index)}
                  />
                </div>
              </div>
              <div className={`card-body pt-0 ${item.expand ? '' : 'd-none'}`}>
                <div className="table-responsive">
                  <Table hover className={`data-table mb-0 ${styles.dataTableMargin}`}>
                    <thead>
                      <tr>
                        <th>
                          <span className="alignTableHeading" onClick={() => handleSort('fromName')}>
                            <span>Variable Name</span>
                          </span>
                        </th>
                        <th>Field Label (Adult)</th>
                        <th>Field Label (Pediatric) &nbsp;</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {item?.CDEQuestions.map((entry, i) => (
                        <tr key={i}>
                          <td className="width-22-td">
                            <div className="variable-name-td ">{entry.variable_name}</div>
                          </td>
                          <td className="width-39-td">{entry?.English?.Adult?.question}</td>
                          <td className="width-39-td">{entry?.English?.Peadiatric?.question}</td>
                          <td
                            className="text-end"
                            onClick={() => {
                              setCdeDetails(entry);
                              setOpenDetailsModal(true);
                            }}
                          >
                            <img src={'/images/eye.svg'} className="cursor-pointer" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          )
      )}
    </div>
  );
};

export default WithAuth(CDELibrary);
