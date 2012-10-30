<?php

function httperror($err) {
  if (!is_string($err)) {
    $err = print_r($err, true);
  }
  header("HTTP/1.0 500 Error occured");
  die($err);
}
