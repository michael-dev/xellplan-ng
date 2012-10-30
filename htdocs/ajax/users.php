<?php

global $pdo, $DB_PREFIX, $pwObj;
include '../../lib/inc.all.php';
requireAdminAuth();

switch ($_REQUEST["action"]):
 case "save":
   if (isset($_REQUEST["password"])) {
     $_REQUEST["password"] = $pwObj->hashPassword($_REQUEST["password"]);
   }
   if (empty($_REQUEST["uid"])) {
     $userStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}users (email, password, admin) VALUES (?, ?, ?)") or httperror($pdo->errorInfo());
     $userStmt->execute(Array($_REQUEST["email"], $_REQUEST["password"], $_REQUEST["admin"])) or httperror($userStmt->errorInfo());
   } else {
     if (isset($_REQUEST["password"])) {
       $userStmt = $pdo->prepare("UPDATE ${DB_PREFIX}users SET password = ? WHERE email = ?") or httperror($pdo->errorInfo());
       $userStmt->execute(Array($_REQUEST["password"], $_REQUEST["uid"])) or httperror($userStmt->errorInfo());
     }
     if (isset($_REQUEST["admin"])) {
       $userStmt = $pdo->prepare("UPDATE ${DB_PREFIX}users SET admin = ? WHERE email = ?") or httperror($pdo->errorInfo());
       $userStmt->execute(Array($_REQUEST["admin"], $_REQUEST["uid"])) or httperror($userStmt->errorInfo());
     }
     if (isset($_REQUEST["email"])) {
       $userStmt = $pdo->prepare("UPDATE ${DB_PREFIX}users SET email = ? WHERE email = ?") or httperror($pdo->errorInfo());
       $userStmt->execute(Array($_REQUEST["email"], $_REQUEST["uid"])) or httperror($userStmt->errorInfo());
     }
   }
 break;
 case "delete":
   $userStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}users WHERE email = ?") or httperror($pdo->errorInfo());
   $userStmt->execute(Array($_REQUEST["uid"])) or httperror($userStmt->errorInfo());
 break;
 case "insertGroup":
   $grpStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}groups (id) VALUES (?)") or httperror($pdo->errorInfo());
   $grpStmt->execute(Array($_REQUEST["group"])) or httperror($grpStmt->errorInfo());
 break;
 case "deleteGroup":
   $grpStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}groups WHERE id = ?") or httperror($pdo->errorInfo());
   $grpStmt->execute(Array($_REQUEST["group"])) or httperror($grpStmt->errorInfo());
   $grpStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}rel_user_group WHERE group_id = ?") or httperror($pdo->errorInfo());
   $grpStmt->execute(Array($_REQUEST["group"])) or httperror($grpStmt->errorInfo());
 break;
 case "addUserToGroup":
   $grpStmt = $pdo->prepare("INSERT INTO ${DB_PREFIX}rel_user_group (group_id, email) VALUES (?, ?)") or httperror($pdo->errorInfo());
   $grpStmt->execute(Array($_REQUEST["group"], $_REQUEST["user"])) or httperror($grpStmt->errorInfo());
 break;
 case "removeUserFromGroup":
   $grpStmt = $pdo->prepare("DELETE FROM ${DB_PREFIX}rel_user_group WHERE group_id = ? AND email = ?") or httperror($pdo->errorInfo());
   $grpStmt->execute(Array($_REQUEST["group"], $_REQUEST["user"])) or httperror($grpStmt->errorInfo());
 break;
 case "list":
 break;
 default:
   httperror("invalid action");
 break;
endswitch;

/* list */
$result = Array();

$users = $pdo->query("SELECT email, password, admin FROM ${DB_PREFIX}users");
$groups = $pdo->query("SELECT id FROM ${DB_PREFIX}groups");
$grpMembers = $pdo->query("SELECT email, group_id FROM ${DB_PREFIX}rel_user_group");

$result["groups"] = Array();
foreach ($groups as $row) {
  $result["groups"][$row["id"]] = $row;
  $result["groups"][$row["id"]]["members"] = Array();
}

$result["users"] = Array();
foreach ($users as $row) {
  $result["users"][$row["email"]] = $row;
  $result["users"][$row["email"]]["groups"] = Array();
}

foreach ($grpMembers as $row) {
  $result["groups"][$row["group_id"]]["members"][] = $row["email"];
  $result["users"][$row["email"]]["groups"][] = $row["group_id"];
}

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

