<?php

global $pdo, $DB_PREFIX;
include '../../lib/inc.all.php';

$grps = $pdo->query("SELECT id FROM ${DB_PREFIX}groups") or httperror($pdo->errorInfo());
$pads = $pdo->query("SELECT group_id, section_id, id, name, comment, eventStart, eventEnd, editStart, editEnd, creator, (editPassword IS NOT NULL) AS editPassword, (adminPassword IS NOT NULL) AS adminPassword, ( (editEnd > NOW()) AND (editStart < NOW()) ) AS userEditable FROM ${DB_PREFIX}pads ORDER BY eventStart") or httperror($pdo->errorInfo());

$result = Array();

foreach ($grps as $row) {
  $result[$row["id"]] = Array();
  $result[$row["id"]][''] = Array();
}

foreach ($pads as $row) {
  $result[$row["group_id"]][$row["section_id"]][$row["id"]] = $row;
}

header("Content-Type: text/json; charset=UTF-8");
echo json_encode($result);

