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
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.name, employee.manager_id 
    FROM employee
    INNER JOIN role
    ON employee.role_id=role.id
    INNER JOIN department
    ON role.department_id=department.id;`)
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
  inquirer.prompt(
    {
      type: 'input',
      name: 'first_name',
      message: "What is the Employee's first name?"
    },
    {
      type: 'input',
      name: 'last_name',
      message: "What is the Employee's last name?"
    }
  )
  .then(answers => {
    connection.queryPromise(`
    INSERT INTO employee (first_name, last_name)
    VALUES (?)`, [answers.first_name, answers.last_name])
    promptUser();
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
      viewEmployee()
    } if (answers.options === 'View All Departments') {
      viewDepartments()
    } if (answers.options === 'View All Roles') {
      viewRoles()
    } if (answers.options === 'Add a Department') {
      addDepartment()
    }
    if (answers.options === 'Add a Role') {
      addRole();
    }
    if (answers.options === 'Done') {
      connection.end();
    }
  })
};