<?php

function httperror($err) {
  if (!is_string($err)) {
    $err = print_r($err, true);
  }
  header("HTTP/1.0 500 Error occured");
  $e = new Exception;
  $backtrace = $e->getTraceAsString();
  echo "Error: $err\n";
  echo "Backtrace:\n $backtrace\n";
  die($err);
}
