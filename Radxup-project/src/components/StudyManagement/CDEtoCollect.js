import { Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';

import _ from 'lodash';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const CDEtoCollect = (props) => {
  const { cancel, previous, next, styles, collectedCDES, study, isModalView } = props;
  const [masterCDEUniqueCount] = useSelector((Gstate) => [Gstate.CDEList?.masterCDEUniqueCount]);
  const [CDEListLoading, CDElibrary] = useSelector((Gstate) => [Gstate.CDEList?.loading, Gstate?.CDEList?.CDElibrary]);

  const [globalSections, setGlobalSections] = useState([]);

  const [count, setCount] = useState({ total: 0, selected: 0 });

  useEffect(() => {
    if (globalSections.length) {
      let selected = 0;
      let total = 0;
      globalSections.forEach((section) => {
        total = total + section.CDEQuestions.length;
        section.CDEQuestions.forEach((cdeQ) => {
          if (cdeQ.checked) {
            selected = selected + 1;
          }
        });
      });

      setCount({ selected, total: total });
    }
  }, [globalSections]);

  const handleSelectRecords = (event, sectionIndex, que) => {
    const {
      target: { checked },
    } = event;

    if (!que) {
      globalSections[sectionIndex]?.CDEQuestions?.map((question, index) => {
        question.checked = checked;
      });
      globalSections[sectionIndex].checked = checked;
      setGlobalSections([...globalSections]);
    }
    let childrens = globalSections[sectionIndex]?.CDEQuestions;
    function rec(question) {
      let childQuestions = [];
      (function recursive(que) {
        childrens.map((ch) => {
          if (ch?.linked_variable_name?.includes(que?.variable_name)) {
            childQuestions.push(ch);
            recursive(ch);
          }
        });
      })(question);
      return childQuestions;
    }
    if (que) {
      globalSections[sectionIndex]?.CDEQuestions?.map((question, index) => {
        if (question.cde_id === que.cde_id) {
          globalSections[sectionIndex].CDEQuestions[index].checked = checked;
          question.checked = checked;
          let arr = rec(que); // All childrens of the question
          arr.forEach((child) => {
            //Finding index of the child question in all questions
            let idx = globalSections[sectionIndex]?.CDEQuestions.findIndex((q) => q.variable_name == child.variable_name);
            //Found
            if (idx != -1) {
              // Finding Parent questions of the child quesstion
              let parentVariables = globalSections[sectionIndex].CDEQuestions[idx].linked_variable_name;
              // console.log('parentVariables', parentVariables);
              //Selecting/deSelecting every parent
              globalSections[sectionIndex].CDEQuestions.forEach((Que, idx) => {
                if (parentVariables.includes(Que.variable_name)) {
                  globalSections[sectionIndex].CDEQuestions[idx].checked = checked;
                }
              });
              let parentQuestions = globalSections[sectionIndex]?.CDEQuestions.filter((cQ) =>
                parentVariables.includes(cQ.variable_name)
              );

              // Finding if any of the parent is cheked
              let hasPrentChecked = parentQuestions.some((que) => que.checked);
              // console.log('hasPrentChecked', hasPrentChecked);

              //If all parents are unchecked the uncheck child
              if (!hasPrentChecked) {
                globalSections[sectionIndex].CDEQuestions[idx].checked = false;
              }
              if (hasPrentChecked) {
                globalSections[sectionIndex].CDEQuestions[idx].checked = true;
              }
            }
          });
        }
        if (!checked) {
          globalSections[sectionIndex].checked = checked;
        }
        let numOfQuestions = globalSections[sectionIndex]?.CDEQuestions.length;
        let numOfSelectedQuestions = globalSections[sectionIndex]?.CDEQuestions.filter((que) => que.checked);

        if (numOfQuestions === numOfSelectedQuestions.length && numOfSelectedQuestions.length !== 0) {
          globalSections[sectionIndex].checked = checked;
        }
      });
      setGlobalSections([...globalSections]);
    }
  };

  const toggleSection = (index) => {
    globalSections[index].expand = !globalSections[index].expand;
    setGlobalSections([...globalSections]);
  };

  const collectSelectedCDEs = () => {
    let atleastOneSelected = false;
    globalSections.forEach((section) => {
      let isSelected = section.CDEQuestions.some((question) => question.checked);
      if (isSelected) {
        atleastOneSelected = isSelected;
      }
    });
    if (!atleastOneSelected) {
      toast.error('Atleast one question required');
      return;
    }
    next(globalSections);
  };

  useEffect(() => {
    let lib = _.cloneDeep(CDElibrary);
    let collectedCDESQuestions = _.cloneDeep(collectedCDES);
    let maCDEList = lib?.map((section, sidx) => {
      let foundSelectedSec = collectedCDESQuestions.find((sec) => sec?.id == section.id);

      if (foundSelectedSec) {
        //If all question aelected from section then mark section checked
        let isSectionChecked = foundSelectedSec.CDEQuestions.every((q) => q.checked);
        let isSectionSelected = foundSelectedSec.CDEQuestions.some((q) => q.checked);
        section.checked = isSectionChecked;
        section.selected = isSectionSelected;
      }
      section.expand = true;
      let uniqueVariables = [...new Set([...section?.CDEQuestions.map((q) => q?.variable_name)])];
      let uniqueSectionQuestions = [];
      uniqueVariables?.forEach((variable) => {
        //finding question in library
        let foundQue = section?.CDEQuestions?.find((que) => que?.variable_name == variable);
        // Finding question in Collected CDEs
        let foundSelected = collectedCDESQuestions[sidx]?.CDEQuestions?.find((que) => que?.variable_name == variable);

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
            shared_question: !!foundSelected?.shared_question,
            checked: !!foundSelected?.checked,
            variable_name: variable,
            linked_variable_name: englistAdult?.linked_variable_name,
            labelEnglish: englistAdult?.question,
            labelSpanish: spanishAdult?.question,
            question_attributes_label: englistAdult?.question_attributes_label,
            study_id: study?.study_id,
          };

          uniqueSectionQuestions.push(queData);
        }
      });
      section.study_id = study?.study_id;
      section.CDEQuestions = uniqueSectionQuestions;
      return section;
    });
    maCDEList.map((mSec, idx) => {
      mSec.CDEQuestions.map((cdeQ, cIdx) => {
        let arr = rec(cdeQ);
        if (arr.length) {
          arr.forEach((q) => {
            let index = mSec.CDEQuestions.findIndex((cQ) => cQ.variable_name == q.variable_name);
            if (index !== -1) {
              if (!maCDEList[idx].CDEQuestions[index].checked) {
                maCDEList[idx].CDEQuestions[index].checked = cdeQ.checked;
              }
              if (!maCDEList[idx].CDEQuestions[index].shared_question) {
                maCDEList[idx].CDEQuestions[index].shared_question = cdeQ.shared_question;
              }
            }
          });
        }
      });

      function rec(question) {
        let childQuestions = [];
        (function recursive(que) {
          mSec.CDEQuestions.map((ch) => {
            if (ch?.linked_variable_name?.includes(que?.variable_name)) {
              childQuestions.push(ch);
              recursive(ch);
            }
          });
        })(question);
        return childQuestions;
      }
    });

    setGlobalSections(maCDEList);
  }, [CDElibrary?.length, collectedCDES]);

  return (
    <div>
      {!isModalView && (
        <>
          <div className={`${styles.CdeHeadSection}`}>
            <div className={`${styles.CdeHeadTitle}`}>Mandatory Tier 1 CDEs to collect:</div>
            <div className={`${styles.CdeHeadCount}`}>
              <span className={`${styles.CdeHeadSubCount}`}>{count?.selected}</span>/{masterCDEUniqueCount}
            </div>
          </div>

          <div className="sectionContainer">
            {globalSections?.map(
              (item, index) =>
                !!item.CDEQuestions.length && (
                  <div key={index} className={`card mb-2 ${styles.cdeCard}`}>
                    <div className={`d-flex justify-content-between p-2`}>
                      <div className="d-flex ps-4">
                        {item.expand && (
                          <div className={`form-check col-md-1 ms-1 ${styles.checkbox}`}>
                            <input
                              className="form-check-input mt-1"
                              onChange={(e) => handleSelectRecords(e, index)}
                              type="checkbox"
                              checked={item.checked}
                              value=""
                              id="flexCheckDefault"
                            />
                          </div>
                        )}
                        <div className={`col-md-11 w-100 ps-3 ${styles.sectionTitle} `}>
                          SECTION {index + 1}: {item?.name}
                        </div>
                      </div>
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
                    <div className={`card-body pt-1 ${item.expand ? '' : 'd-none'}`}>
                      <div className="table-responsive">
                        <Table hover className={`data-table mb-0 ${styles.dataTableMargin}`}>
                          <thead>
                            <tr>
                              <th></th>
                              {/* <th>Sr. No.</th> */}
                              <th>
                                <span className="alignTableHeading">
                                  <span>Variable Name </span>
                                </span>
                              </th>
                              <th>Field Label (Adult)</th>
                              <th>
                                Field Label (Pediatric) &nbsp;
                                {/* <img src={'/images/filter_icon.svg'} /> */}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {item?.CDEQuestions?.map((entry, i) => (
                              <tr key={i}>
                                <td>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      disabled={entry?.linked_variable_name?.length}
                                      readOnly={entry?.linked_variable_name?.length}
                                      checked={entry.checked}
                                      onChange={(e) => handleSelectRecords(e, index, entry)}
                                      type="checkbox"
                                      id={'flexCheckDefault' + entry.srNo}
                                    />
                                  </div>
                                </td>
                                {/* <td>{i + 1}</td> */}
                                <td className="width-22-td">
                                  <div className="variable-name-td ">{entry.variable_name}</div>
                                </td>
                                <td className="width-39-td">{entry?.English?.Adult?.question}</td>
                                <td className="width-39-td">{entry?.English?.Peadiatric?.question}</td>
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

          <div className="d-flex justify-content-end mt-5 mb-2">
            <div className={`fw-bold ms-3 ${styles.sectionHeading}`}>
              <Button size="md" onClick={previous} className="admin_panel_button primary">
                Previous
              </Button>
            </div>
            <div className={` fw-bold ms-3 ${styles.sectionHeading}`}>
              <Button size="md" className="admin_panel_button dark" onClick={() => cancel(study?.study_id)}>
                Cancel
              </Button>
            </div>
            <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
              <Button size="md" className="admin_panel_button secondary" onClick={collectSelectedCDEs}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      {isModalView && (
        <div className="sectionContainer">
          {globalSections?.map(
            (item, index) =>
              item?.selected && (
                <div key={index} className={`card mb-2 ${styles.cdeCard}`}>
                  <div className={`d-flex justify-content-between p-2`}>
                    <div className="d-flex ps-4">
                      {/* {sections[index].expand && (
                        <div className={`form-check col-md-1 ms-1 ${styles.checkbox}`}>
                          <input
                            className="form-check-input mt-2"
                            onChange={(e) => handleSelectRecords(e, index)}
                            type="checkbox"
                            checked={item.checked}
                            value=""
                            id="flexCheckDefault"
                          />
                        </div>
                      )} */}
                      <div className={`col-md-11 w-100 ps-3 ${styles.sectionTitle} `}>
                        Section {index + 1}: {item?.name}
                      </div>
                    </div>
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
                  <div className={`card-body pt-1 ${item.expand ? '' : 'd-none'}`}>
                    <div className="table-responsive">
                      <Table hover className={`data-table mb-0 ${styles.dataTableMargin}`}>
                        <thead>
                          <tr>
                            {/* <th></th> */}
                            {/* <th>Sr. No.</th> */}
                            <th>
                              <span className="alignTableHeading">
                                <span>Variable Name</span>
                              </span>
                            </th>
                            <th>Field Label(Adult)</th>
                            <th>
                              Field Label(Pediatric) &nbsp;
                              {/* <img src={'/images/filter_icon.svg'} /> */}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item?.CDEQuestions?.map(
                            (entry, i) =>
                              entry?.checked && (
                                <tr key={i}>
                                  {/* <td>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    checked={entry.checked}
                                    onChange={(e) => handleSelectRecords(e, index, entry)}
                                    type="checkbox"
                                    id={'flexCheckDefault' + entry.srNo}
                                  />
                                </div>
                              </td> */}
                                  {/* <td>{i + 1}</td> */}
                                  <td>{entry.variable_name}</td>
                                  <td>{entry?.English?.Adult?.question}</td>
                                  <td>{entry?.English?.Peadiatric?.question}</td>
                                </tr>
                              )
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};
export default CDEtoCollect;
