import { Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import _ from 'lodash';
import { useSelector } from 'react-redux';

const CDEtoShare = (props) => {
  const { cancel, previous, next, styles, collectedCDES, isModalView, study } = props;

  const [sections, setSections] = useState([]);
  const [count, setCount] = useState({ total: 0, selected: 0 });
  const [masterCDEQuestiosnList] = useSelector((Gstate) => [Gstate.CDEList?.masterCDEQuestiosnList]);

  useEffect(() => {
    if (collectedCDES?.length) {
      let selectedSections = [];
      // let cdeData = [...JSON.parse(JSON.stringify(collectedCDES))];
      selectedSections = collectedCDES.map((section, index) => {
        section.selected = false;
        let selectedQuestions = [];
        section?.CDEQuestions?.forEach((que, index) => {
          if (que.checked) {
            // selectedQuestions.push(que);
            section.selected = true;
          }
        });
        let numOfQuestions = section?.CDEQuestions.filter((que) => que.checked);
        let numOfSelectedQuestions = section?.CDEQuestions.filter((que) => que.shared_question); //que.shared_question
        if (numOfSelectedQuestions?.length && numOfQuestions?.length) {
          if (numOfQuestions?.length === numOfSelectedQuestions?.length) {
            section.shared_question = true;
          }
        }
        // if (selectedQuestions.length) {
        //   selectedSections.push({ ...section, CDEQuestions: [...selectedQuestions] });
        // }
        return section;
      });
      setSections([...selectedSections]);
    }
  }, [collectedCDES?.length]);

  useEffect(() => {
    if (sections.length) {
      let selectedCount = 0;
      let totalCount = 0;
      let usedMultiChildVariables = [];
      let usedTotalMultiChildVariables = [];

      sections.forEach((section) => {
        let checkedQuestion = section.CDEQuestions.filter((que) => que.checked);
        let globalSection = masterCDEQuestiosnList.find((sec) => sec.name === section.name);

        let sharedQuestions = checkedQuestion.filter((que) => que.shared_question);
        selectedCount = selectedCount + sharedQuestions?.length;
        totalCount = totalCount + checkedQuestion?.length;
      });

      setCount({ selected: selectedCount, total: totalCount });
    }
  }, [sections]);

  const handleSelectRecords = (event, sectionIndex, que) => {
    const {
      target: { checked },
    } = event;

    if (!que) {
      let sectionData;
      let checkedQns = sections[sectionIndex]?.CDEQuestions.filter((que) => que.checked);
      checkedQns = checkedQns?.map((question, index) => {
        question.shared_question = checked;
        return question;
      });
      sections[sectionIndex].shared_question = checked;
      setSections([...sections]);
    }
    let childrens = sections[sectionIndex]?.CDEQuestions.filter((q) => q.checked);
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
      sections[sectionIndex]?.CDEQuestions?.map((question, index) => {
        if (question.cde_id === que.cde_id) {
          question.shared_question = checked;
          let arr = rec(que); // All childrens of the question
          arr.forEach((child) => {
            //Finding index of the child question in all questions
            let idx = sections[sectionIndex]?.CDEQuestions.findIndex((q) => q.variable_name == child.variable_name);
            //Found
            if (idx != -1) {
              // Finding Parent questions of the child quesstion
              let parentVariables = sections[sectionIndex].CDEQuestions[idx].linked_variable_name;

              //Selecting/deSelecting every parent
              sections[sectionIndex].CDEQuestions.forEach((Que, idx) => {
                if (parentVariables.includes(Que.variable_name)) {
                  sections[sectionIndex].CDEQuestions[idx].shared_question = checked;
                }
              });
              // console.log('parentVariables', parentVariables);
              let parentQuestions = sections[sectionIndex]?.CDEQuestions.filter((cQ) =>
                parentVariables.includes(cQ.variable_name)
              );

              // Finding if any of the parent is cheked
              let hasPrentChecked = parentQuestions.some((que) => que.shared_question);
              // console.log('hasPrentChecked', hasPrentChecked);

              //If all parents are unchecked the uncheck child
              if (!hasPrentChecked) {
                sections[sectionIndex].CDEQuestions[idx].shared_question = false;
              }
              if (hasPrentChecked) {
                sections[sectionIndex].CDEQuestions[idx].shared_question = true;
              }
            }
          });
        }
        if (!checked) {
          sections[sectionIndex].shared_question = checked;
        }
        let numOfQuestions = sections[sectionIndex]?.CDEQuestions.filter((que) => que.checked).length;
        let numOfSelectedQuestions = sections[sectionIndex]?.CDEQuestions.filter((que) => que.shared_question); //que.shared_question
        if (numOfSelectedQuestions.length && numOfQuestions) {
          if (numOfQuestions === numOfSelectedQuestions?.length) {
            sections[sectionIndex].shared_question = true;
          }
        }
      });
      setSections([...sections]);
    }
  };

  const toggleSection = (index) => {
    sections[index].expand = !sections[index].expand;
    setSections([...sections]);
  };

  const onNext = () => {
    next(sections);
  };

  const isVisible = (item) => {
    return item.CDEQuestions.some((que) => que.shared_question);
  };

  return (
    <div>
      {!isModalView && (
        <>
          <div className={`${styles.CdeHeadSection}`}>
            <div className={`${styles.CdeHeadTitle}`}>Mandatory Tier 1 CDEs to share:</div>
            <div className={`${styles.CdeHeadCount}`}>
              <span className={`${styles.CdeHeadSubCount}`}>{count?.selected}</span>/{count?.total}
            </div>
          </div>

          <div className="sectionContainer">
            {sections?.map(
              (item, index) =>
                item?.selected && (
                  <div key={index} className={`card mb-2 ${styles.cdeCard}`}>
                    <div className={`d-flex justify-content-between p-2`}>
                      <div className="d-flex ps-4">
                        {sections[index].expand && (
                          <div className={`form-check col-md-1 ms-1 ${styles.checkbox}`}>
                            <input
                              className="form-check-input mt-1"
                              onChange={(e) => handleSelectRecords(e, index)}
                              type="checkbox"
                              checked={item.shared_question}
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
                                  <span>Variable Name</span>
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
                            {item?.CDEQuestions?.map(
                              (entry, i) =>
                                entry?.checked && (
                                  <tr key={i}>
                                    <td>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          disabled={entry?.linked_variable_name?.length}
                                          readOnly={entry?.linked_variable_name?.length}
                                          checked={entry.shared_question}
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

          <div className="d-flex justify-content-end mt-5 mb-2">
            <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
              <Button size="md" className="admin_panel_button primary" onClick={previous}>
                Previous
              </Button>
            </div>
            <div className={` fw-bold ms-3 ${styles.sectionHeading}`}>
              <Button size="md" className="admin_panel_button dark" onClick={() => cancel(study?.study_id)}>
                Cancel
              </Button>
            </div>
            <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
              <Button size="md" className="admin_panel_button secondary" onClick={onNext}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      {isModalView && (
        <div className="sectionContainer">
          {sections?.map(
            (item, index) =>
              isVisible(item) && (
                <div key={index} className={`card mb-2 ${styles.cdeCard}`}>
                  <div className={`d-flex justify-content-between p-2`}>
                    <div className="d-flex ps-4">
                      {/* {sections[index].expand && (
                        <div className={`form-check col-md-1 ms-1 ${styles.checkbox}`}>
                          <input
                            className="form-check-input mt-2"
                            onChange={(e) => handleSelectRecords(e, index)}
                            type="checkbox"
                            checked={item.shared_question}
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
                              entry?.shared_question && (
                                <tr key={i}>
                                  {/* <td>
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        checked={entry.shared_question}
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
export default CDEtoShare;
