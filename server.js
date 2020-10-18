// get the client
const mysql = require('mysql2');
const inquirer = require('inquirer');
const util = require('util');

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'employee_db',
  password: 'password'
});

connection.connect();
connection.queryPromise = util.promisify(connection.query);

// functions for inquierer 
function viewDepartments() {
  connection.queryPromise(`
  SELECT id, name 
  FROM department
  `)
    .then(departments => {
      console.table(departments);
      promptUser();
    })
    .catch(err => {
      console.error(err);
    });
}

function viewRoles() {
  connection.queryPromise(
    `SELECT role.id, role.title, role.salary, department.name 
    FROM role
    INNER JOIN department
    ON role.department_id=department.id;`)
    .then(departments => {
      console.table(departments);
      promptUser();
    })
    .catch(err => {
      console.error(err);
    });
}

function viewEmployee() {
  connection.queryPromise(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
    FROM employee 
    LEFT JOIN role on employee.role_id = role.id 
    LEFT JOIN department on role.department_id = department.id 
    LEFT JOIN employee manager on manager.id = employee.manager_id;`)
    .then(employee => {
      console.table(employee);
      promptUser();
    })
    .catch(err => {
      console.error(err);
    });
}

function addDepartment() {
  inquirer.prompt(
    {
      type: 'input',
      name: 'departmentName',
      message: 'What would you like to call the department?'
    }
  )
    .then(answers => {
      connection.queryPromise(`
    INSERT INTO department (name)
    VALUES (?)`, [answers.departmentName])
      promptUser();
    })
    .catch(err => {
      console.error(err);
    });
}

function addRole() {
  connection.queryPromise('SELECT * FROM department')
    .then(departments => {
      departments = departments.map(department => {
        return {
          value: department.id,
          name: department.name
        }
      });
      return inquirer.prompt([
        {
          type: 'list',
          name: 'departmentId',
          message: 'Select the department',
          choices: departments,
        },
        {
          type: 'input',
          name: 'title',
          message: 'Input the title'
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Input the salary'
        }
      ])
    })
    .then(answers => {
      connection.queryPromise(`
    INSERT INTO role (department_id, title, salary)
    VALUES (?,?,?)`, [answers.departmentId, answers.title, answers.salary])
      promptUser();
      console.log(answers);
    })
    .catch(err => {
      console.error(err);
    });
}

function addEmployee() {
  inquirer.prompt([
    {
      name: 'first_name',
      message: "What is the employee's first name?"
    },
    {
      name: 'last_name',
      message: "What is the employee's last name?"
    }
  ]).then(res => {
    const firstName = res.first_name;
    const lastName = res.last_name;
    findAllRoles().then(([rows]) => {
      const roles = rows;
      const roleChoices = roles.map(({ id, title }) => ({
        name: title,
        value: id
      }));
      inquirer.prompt({
        type: 'list',
        name: 'roleId',
        message: "What is the employee's role?",
        choices: roleChoices
      }).then(res => {
        const { roleId } = res;
        findAllEmployees().then(([rows]) => {
          const employees = rows;
          const managerChoices = employees.map(
            ({ id, first_name, last_name }) => ({
              name: `${first_name} ${last_name}`,
              value: id
            })
          );
          managerChoices.unshift({ name: 'None', value: null });
          inquirer.prompt({
            type: 'list',
            name: 'managerId',
            message: "Who is the employee's manager?",
            choices: managerChoices
          })
            .then(res => {
              const employee = {
                manager_id: res.managerId,
                role_id: roleId,
                first_name: firstName,
                last_name: lastName
              };
              createEmployee(employee);
            })
            .then(() =>
              console.log(`Added ${firstName} ${lastName} to the database`)
            )
            .then(() => promptUser());
        });
      });
    });
  });
}

function updateEmployeeRole() {
  console.log("I'm running")
  connection.queryPromise('SELECT * FROM employee')
    .then(employees => {
      employees = employees.map(employee => {
        return {
          value: employee.id,
          name: employee.first_name + " " + employee.last_name
        }
      });
  connection.queryPromise('SELECT * FROM role')
    .then(roles => {
      roles = roles.map(role => {
            return {
              value: role.id,
              name: role.title
            }
          });
          return inquirer.prompt([
            {
              type: 'list',
              name: 'employeeId',
              message: 'Select the employee',
              choices: employees,
            },
            {
              type: 'list',
              name: 'roleId',
              message: 'Select the updated role',
              choices: roles,
            }
          ])
            .then(answers => {
              connection.queryPromise(`
        UPDATE employee
        SET role_id = ?
        WHERE id = ? 
        `, [answers.roleId, answers.employeeId])
              promptUser();
            })
        });
    })
    .catch(err => {
      console.error(err);
    });


}

// ********   INQUIERER   ********
const promptUser = () => {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'options',
      message: 'What would you like to do?',
      choices: ['View All Departments', 'View All Roles', 'View All Employees', 'Add a Department', 'Add a Role', 'Add an Employee', 'Update an Employee Role', 'Done']
    }
  ])
    .then(answers => {
      if (answers.options === 'View All Employees') {
        viewEmployee();
      } if (answers.options === 'View All Departments') {
        viewDepartments();
      } if (answers.options === 'View All Roles') {
        viewRoles();
      } if (answers.options === 'Add a Department') {
        addDepartment();
      }
      if (answers.options === 'Add a Role') {
        addRole();
      }
      if (answers.options === 'Add an Employee') {
        addEmployee();
      }
      if (answers.options === 'Update an Employee Role') {
        updateEmployeeRole();
      }
      if (answers.options === 'Done') {
        connection.end();
      }
    })
};

// ******* HELPER FUNCTIONS *******

function findAllRoles() {
  return connection.promise().query(
    `SELECT role.id, role.title, department.name, role.salary
    FROM role 
    LEFT JOIN department ON role.department_id = department.id`
  )
};

function findAllEmployees() {
  return connection.promise().query(
    "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id;"
  );
};

function createEmployee(employee) {
  return connection.promise().query(
    `INSERT INTO employee SET ?`, employee
  )
};

promptUser();