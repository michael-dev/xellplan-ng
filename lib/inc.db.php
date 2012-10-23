<?php

global $pdo;
global $DB_DSN, $DB_USERNAME, $DB_PASSWORD, $DB_PREFIX;

$pdo = new PDO($DB_DSN, $DB_USERNAME, $DB_PASSWORD);

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}groups");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}groups ( id VARCHAR(128) NOT NULL, PRIMARY KEY (id) );") or die(print_r($pdo->errorInfo(),true));
}

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}pads");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}pads (         id INT NOT NULL AUTO_INCREMENT,
                                                 group_id VARCHAR(128) NOT NULL,
                                               section_id VARCHAR(128) NOT NULL,
                                                     name VARCHAR(128) NOT NULL,
                                                  comment TEXT DEFAULT '' NOT NULL,
                                               eventStart DATETIME NOT NULL,
                                                 eventEnd DATETIME NOT NULL,
                                                editStart DATETIME NOT NULL,
                                                  editEnd DATETIME NOT NULL,
                                                  creator VARCHAR(128) NOT NULL,
                                             editPassword VARCHAR(128) DEFAULT NULL,
                                                  PRIMARY KEY (id) );") or die(print_r($pdo->errorInfo(),true));
}

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}users");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}users (     email VARCHAR(128) NOT NULL,
                                                 password VARCHAR(128),
                                                    admin BOOLEAN,
                                                  PRIMARY KEY (email) );") or die(print_r($pdo->errorInfo(),true));
  $pdo->query("INSERT INTO ${DB_PREFIX}users (email, password, admin) VALUES ( 'm.braun@tu-ilmenau.de', '\$2a\$10\$J7BONCOLB6BrLUhM3KtD8upYL9C/yM7g.9d9PUhPb1Qp6/0TY1xsi', 1)");
}

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}rel_user_group");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}rel_user_group (
                                                    email VARCHAR(128) NOT NULL,
                                                 group_id VARCHAR(128) NOT NULL,
                                                  PRIMARY KEY (email, group_id) );") or die(print_r($pdo->errorInfo(),true));
}

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}pad_data");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}pad_data (
                                                  pad_id INT,
                                                     row INT,
                                                     col INT,
                                                    text VARCHAR(128),
                                                 classes VARCHAR(128),
                                           userEditField BOOLEAN,
                                                 PRIMARY KEY (pad_id, row, col) );") or die(print_r($pdo->errorInfo(),true));
}

