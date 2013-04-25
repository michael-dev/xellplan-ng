<?php

global $DB_DSN, $DB_USERNAME, $DB_PASSWORD, $DB_PREFIX, $SIMPLESAML, $SIMPLESAMLAUTHSOURCE, $loginMode, $captchaCookie, $orgs;

$DB_DSN = "mysql:dbname=...;host=...";
$DB_USERNAME = "";
$DB_PASSWORD = "";
$DB_PREFIX = "";
$SIMPLESAML = dirname(dirname(dirname(__FILE__)))."/simplesamlphp/";
$SIMPLESAMLAUTHSOURCE = "";
$loginMode = "combined"; // basic,simplesaml,combined
$captchaCookie = true;
$orgs = Array("StuRa","FSR EI","FSR IA","FSR MB","FSR MN","FSR WW");

