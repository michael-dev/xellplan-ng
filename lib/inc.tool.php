<?php
function in_arrayi($needle, $haystack) {
  return in_array(strtolower($needle), array_map('strtolower', $haystack));
}

/* 65 (A) - 90 (Z): 26 Zeichen */
function colName($i) {
  $c = '';
  $i = $i + 1;
  while ($i > 0) {
    $i--;
    $j = $i % 26;
    $i = ($i - $j ) / 26;
    $c = chr($j + 65) . $c;
  };
  return $c;
}
