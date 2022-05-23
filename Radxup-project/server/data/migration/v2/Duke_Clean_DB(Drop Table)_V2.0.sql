/*
drop table "CDEQuestionsAttributes";
drop table "CDEQuestions" ;
drop table "CDESections" ;
drop table "CDEeICFAttributes" ;
drop table "CDEeICFQuestions";
*/

drop table "Images" ;
drop table "SurveyDetails";
drop table "Survey" ;
drop table "UserFormMapping" ;
drop table "dependencyQueue" ;

drop table "eICFFQAttributes"  ;
drop table "eICFFQuestions"  ;
drop table "eICFFormsDependency"  ;
drop table "eICFForms"  ;


drop table "FSQAttributes" ;
drop table "FSQuestions" ;
drop table "FormsSections" ;
drop table "FormDependencyMapping" ;
drop table "Forms" ;
drop table "FormEmailMapping"  ;

drop table "StudyEmailTemplates" ;
drop table "eICF" ;
drop table "StudyCDEQuestionsAttributes" ;
drop table "StudyCDEQuestions";
drop table "StudyCDESections";
drop table "AuditTrail" ;
drop table "Arms";
drop table "StudyUserMapping";
drop table "Schedular" ;

drop table "StudyDocuments";
drop table "Feedbacks";
/*
drop table "Users";
drop table "Study" ;
*/


delete from "Users" where id >7;
delete from "Study" where id > 1 ;
ALTER SEQUENCE public."Study_id_seq" RESTART 2;
ALTER SEQUENCE public."Users_id_seq" RESTART 8;
