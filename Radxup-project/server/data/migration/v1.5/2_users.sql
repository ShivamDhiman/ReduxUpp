delete from public."Users";
ALTER SEQUENCE public."Users_id_seq" RESTART 8;
INSERT INTO public."Users" (id,"UID",study_id,first_name,last_name,personal_email,mobile_phone,participant_id,role_id,status,initiated_by,created_by,created_at,updated_by,updated_at) VALUES
	 (1,'VASIM9988',1,'Vasim','Rana','var17@duke.edu','1122334455',NULL,4,'Active','SUPER_ADMIN',1,'2022-01-10 21:35:34.462+05:30',1,'2022-01-26 10:26:11.125+05:30'),
	 (2,'DHAVTW853503',1,'James','Topping','toppi001@duke.edu','1122334455',NULL,4,'Active','SUPER_ADMIN',1,'2022-01-10 21:35:34.462+05:30',1,'2022-01-10 21:35:34.462+05:30'),
	 (3,'DHAVTW853507',1,'Dylan','Price','dfp12@duke.edu','1122334455',NULL,4,'Active','SUPER_ADMIN',1,'2022-01-10 21:35:34.462+05:30',1,'2022-01-10 21:35:34.462+05:30'),
	 (4,'DHAVTW853510',1,'Courtney','Mann','cmm88@duke.edu','1122334455',NULL,4,'Active','SUPER_ADMIN',1,'2022-01-10 21:35:34.462+05:30',1,'2022-01-10 21:35:34.462+05:30'),
	 (5,'DHAVTW853521',1,'Shubhdeep','Singh','ss1267@duke.edu','1122334455',NULL,4,'Active','SUPER_ADMIN',1,'2022-01-10 21:35:34.462+05:30',1,'2022-01-10 21:35:34.462+05:30'),
	(6, 'DHAVTW853506', 1, 'Senthil', 'Murugesan', 'murug001@duke.edu', '1122334455', NULL, 4,'Active','SUPER_ADMIN',1,'2022-01-10 21:35:34.462+05:30',1,'2022-01-10 21:35:34.462+05:30'),
    (7, 'DHAVTW853508', 1, 'Dianne', 'Oliver-Clapsaddle', 'dto2@duke.edu', '1122334455', NULL,4,'Active','SUPER_ADMIN',1,'2022-01-10 21:35:34.462+05:30',1,'2022-01-10 21:35:34.462+05:30');
