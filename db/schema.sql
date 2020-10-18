create database employee_db;
use employee_db;

CREATE TABLE employee(
id INT auto_increment primary key,
first_name varchar(30),
last_name varchar(30),
role_id int,
manager_id int
);

CREATE TABLE role(
id INT auto_increment primary key,
title varchar(30),
salary decimal,
department_id int
);

CREATE TABLE department(
id INT auto_increment primary key,
name varchar(30)
);