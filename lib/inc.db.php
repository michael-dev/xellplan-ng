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
                                                 expireAt DATETIME DEFAULT NULL,
                                               eventStart DATETIME DEFAULT NULL,
                                                 eventEnd DATETIME DEFAULT NULL,
                                                editStart DATETIME DEFAULT NULL,
                                                  editEnd DATETIME DEFAULT NULL,
                                                  creator VARCHAR(128) NOT NULL,
						  contact VARCHAR(128) DEFAULT NULL,
                                             editPassword VARCHAR(128) DEFAULT NULL,
                                            adminPassword VARCHAR(128) DEFAULT NULL,
                                                  PRIMARY KEY (id) );") or die(print_r($pdo->errorInfo(),true));
}

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}pad_width");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}pad_width ( pad_id INT NOT NULL,
                                                      type VARCHAR(128) NOT NULL,
                                                       idx INT NOT NULL,
                                                     width INT NOT NULL
                                                  );") or die(print_r($pdo->errorInfo(),true));
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

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}pad_assistant");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}pad_assistant (
                                                  pad_id INT,
                                                     row INT,
                                                     col INT,
                                                    name VARCHAR(128),
                                            organization VARCHAR(128),
                                                   email VARCHAR(128),
                                                 PRIMARY KEY (pad_id, row, col) );") or die(print_r($pdo->errorInfo(),true));
}

$r = $pdo->query("SELECT COUNT(*) FROM ${DB_PREFIX}pad_log");
if ($r === false) {
  $pdo->query("CREATE TABLE ${DB_PREFIX}pad_log (
                                                  pad_id INT,
                                                     row INT,
                                                     col INT,
                                               eventTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                    text VARCHAR(128)
                                                );") or die(print_r($pdo->errorInfo(),true));
}

function requireAdminAuth() {
  global $pdo, $DB_PREFIX, $pwObj, $attributes, $loginMode;

  # HTTP BASIC auth provided
  if (isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "simplesaml")) {
    $userStmt = $pdo->prepare("SELECT password FROM ${DB_PREFIX}users WHERE admin AND email = ?") or die(print_r($pdo->errorInfo(),true));
    $userStmt->execute(Array($_SERVER['PHP_AUTH_USER'])) or die(print_r($userStmt->errorInfo(),true));
    $res = $userStmt->fetchAll(PDO::FETCH_ASSOC);
    if (is_array($res) && count($res) == 1) {
      $passwordHash = $res[0]["password"];
      $password = $_SERVER['PHP_AUTH_PW'];
      if (!$pwObj->hashVerify($password, $passwordHash)) {
        unset($_SERVER['PHP_AUTH_USER']);
      }
    } else {
      unset($_SERVER['PHP_AUTH_USER']);
    }
  } else {
    unset($_SERVER['PHP_AUTH_USER']);
  }

  # SimpleSAML auth
  if (($attributes !== NULL) && !isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "basic")) {
    if (in_array("admin", $attributes["groups"])) {
      $_SERVER['PHP_AUTH_USER'] = $attributes["mail"][0];
    } else {
      $userStmt = $pdo->prepare("SELECT * FROM ${DB_PREFIX}users WHERE admin AND email = ?") or die(print_r($pdo->errorInfo(),true));
      $userStmt->execute(Array($attributes["mail"][0])) or die(print_r($userStmt->errorInfo(),true));
      $res = $userStmt->fetchAll(PDO::FETCH_ASSOC);
      if (is_array($res) && count($res) == 1) {
        $_SERVER['PHP_AUTH_USER'] = $attributes["mail"][0];
      }
    }
  }
 
  # final decision reporting 
  if (!isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "simplesaml")) {
      header('WWW-Authenticate: Basic realm="XellPlan-NG Administrator"');
      header('HTTP/1.0 401 Unauthorized');
      echo 'Admin-Rechte für Nutzerverwaltung benötigt. ';
      if ($loginMode != "basic") echo "Schon das sGIS Login (Login-Leiste oben) probiert?";
      exit;
  } else {
      header('HTTP/1.0 403 Forbidden');
      echo 'Admin-Rechte für Nutzerverwaltung benötigt. Bitte mittels sGIS einloggen (Login-Leiste oben).';
      exit;
  }
}

function requireGroupAdmin($groupId) {
  global $pdo, $DB_PREFIX, $pwObj, $loginMode, $attributes;

  # HTTP BASIC auth provided
  if (isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "simplesaml")) {
    $userStmt = $pdo->prepare("SELECT password
                                 FROM ${DB_PREFIX}users
				WHERE email = ? AND (admin OR email IN (
				       SELECT email
				         FROM ${DB_PREFIX}rel_user_group rug
					WHERE group_id = ? ))
			      ") or die(print_r($pdo->errorInfo(),true));
    $userStmt->execute(Array($_SERVER['PHP_AUTH_USER'], $groupId)) or die(print_r($userStmt->errorInfo(),true));
    $res = $userStmt->fetchAll(PDO::FETCH_ASSOC);
    if (is_array($res) && count($res) == 1) {
      $passwordHash = $res[0]["password"];
      $password = $_SERVER['PHP_AUTH_PW'];
      if (!$pwObj->hashVerify($password, $passwordHash)) {
        unset($_SERVER['PHP_AUTH_USER']);
      }
    } else {
      unset($_SERVER['PHP_AUTH_USER']);
    }
  } else {
    unset($_SERVER['PHP_AUTH_USER']);
  }

  # SimpleSAML auth
  if (($attributes !== NULL) && !isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "basic")) {
    if (in_array($groupId, $attributes["groups"]) || in_array("admin", $attributes["groups"])) {
      $_SERVER['PHP_AUTH_USER'] = $attributes["mail"][0];
    } else {
      $userStmt = $pdo->prepare("SELECT * FROM ${DB_PREFIX}rel_user_group rug WHERE group_id = ? AND email = ?") or die(print_r($pdo->errorInfo(),true));
      $userStmt->execute(Array($groupId, $attributes["mail"][0])) or die(print_r($userStmt->errorInfo(),true));
      $res = $userStmt->fetchAll(PDO::FETCH_ASSOC);
      if (is_array($res) && count($res) > 0) {
        $_SERVER['PHP_AUTH_USER'] = $attributes["mail"][0];
      }
    }
  }
  
  # final decision reporting 
  if (!isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "simplesaml")) {
      header('WWW-Authenticate: Basic realm="XellPlan-NG Gruppeadministrator "'.$groupId);
      header('HTTP/1.0 401 Unauthorized');
      echo 'Admin-Rechte für Gruppe '.htmlspecialchars($groupId).' benötigt. ';
      if ($loginMode != "basic") echo "Schon das sGIS Login (Login-Leiste oben) probiert?";
      exit;
  } else {
      header('HTTP/1.0 403 Forbidden');
      echo 'Admin-Rechte für Gruppe benötigt. Bitte mittels sGIS einloggen (Login-Leiste oben).';
      exit;
  }
}

function requirePadAdmin($padId) {
  global $pdo, $DB_PREFIX, $pwObj, $attributes, $loginMode;

  # HTTP BASIC auth provided
  if (isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "simplesaml")) {
    $userStmt = $pdo->prepare("SELECT password
                                 FROM ${DB_PREFIX}users
				WHERE email = ? AND (admin OR email IN (
				       SELECT email
				         FROM ${DB_PREFIX}rel_user_group rug INNER JOIN ${DB_PREFIX}pads p ON p.group_id = rug.group_id
					WHERE p.id = ? ))
			      ") or die(print_r($pdo->errorInfo(),true));
    $userStmt->execute(Array($_SERVER['PHP_AUTH_USER'], $padId)) or die(print_r($userStmt->errorInfo(),true));
    $res = $userStmt->fetchAll(PDO::FETCH_ASSOC);
    if (is_array($res) && count($res) == 1) {
      $passwordHash = $res[0]["password"];
      $password = $_SERVER['PHP_AUTH_PW'];
      if (!$pwObj->hashVerify($password, $passwordHash)) {
        unset($_SERVER['PHP_AUTH_USER']);
      }
    } else {
      unset($_SERVER['PHP_AUTH_USER']);
    }
  } else {
    unset($_SERVER['PHP_AUTH_USER']);
  }
  # pad password stays permitted even with loginMode == simplesaml
  if (isset($_SERVER['PHP_AUTH_PW']) && !isset($_SERVER['PHP_AUTH_USER'])) {
    $padStmt = $pdo->prepare("SELECT adminPassword FROM ${DB_PREFIX}pads WHERE id = ? AND (adminPassword IS NOT NULL)") or die(print_r($pdo->errorInfo(),true));
    $padStmt->execute(Array($padId)) or die(print_r($userStmt->errorInfo(),true));
    $res = $padStmt->fetchAll(PDO::FETCH_ASSOC);
    if (is_array($res) && count($res) == 1 && !empty($res[0]["adminPassword"])) {
      $passwordHash = $res[0]["adminPassword"];
      $password = $_SERVER['PHP_AUTH_PW'];
      if (!$pwObj->hashVerify($password, $passwordHash)) {
        unset($_SERVER['PHP_AUTH_PW']);
      }
    } else {
      unset($_SERVER['PHP_AUTH_PW']);
    }
  }

  # SimpleSAML auth
  if (($attributes !== NULL) && !isset($_SERVER['PHP_AUTH_USER']) && ($loginMode != "basic")) {
    $grpStmt = $pdo->prepare("SELECT group_id FROM ${DB_PREFIX}pads p WHERE id = ?") or die(print_r($pdo->errorInfo(),true));
    $grpStmt->execute(Array($padId)) or die(print_r($grpStmt->errorInfo(),true));
    if ($grpStmt->rowCount() > 0) {
      $padGroup = $grpStmt->fetchColumn();
      if (in_array($padGroup, $attributes["groups"]) || in_array("admin", $attributes["groups"])) {
        $_SERVER['PHP_AUTH_USER'] = $attributes["mail"][0];
        $_SERVER['PHP_AUTH_PW'] = 'any';
      } else {
        $userStmt = $pdo->prepare("SELECT * FROM ${DB_PREFIX}rel_user_group rug WHERE group_id = ? AND email = ?") or die(print_r($pdo->errorInfo(),true));
        $userStmt->execute(Array($groupId, $attributes["mail"][0])) or die(print_r($userStmt->errorInfo(),true));
        $res = $userStmt->fetchAll(PDO::FETCH_ASSOC);
        if (is_array($res) && count($res) > 0) {
          $_SERVER['PHP_AUTH_USER'] = $attributes["mail"][0];
          $_SERVER['PHP_AUTH_PW'] = 'any';
        }
      }
    } else {
      httperror("Pad not found.");
    }
  }

  # final decision reporting 
  if (!isset($_SERVER['PHP_AUTH_PW'])) {
      header('WWW-Authenticate: Basic realm="XellPlan-NG Plan-Administrator "'.$planId);
      header('HTTP/1.0 401 Unauthorized');
      echo 'Admin-Rechte für Pad '.htmlspecialchars($padId).' benötigt. ';
      if ($loginMode != "basic") echo "Schon das sGIS Login (Login-Leiste oben) probiert?";
      exit;
  }
}

# vim: set expandtab tabstop=8 shiftwidth=8 :
