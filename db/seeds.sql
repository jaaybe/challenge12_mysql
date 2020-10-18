use employee_db;
INSERT INTO department (name)
VALUES ('sales'), ('engineering'), ('management'), ('hr');
use employee_db;
INSERT INTO role (title, salary, department_id)
VALUES ('CEO', 100000, 3), ('VP', 80000, 3), ('Manager', 75000, 3);
use employee_db;
SELECT * FROM role;
use employee_db;
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('JB', 'Blot', 1, 1), ('Jim', 'Smith', 2, 1);