<?php
/**
 * Logout — Destroys session and redirects to login
 */
require_once 'config.php';

$_SESSION = [];
session_destroy();

header('Location: login.php');
exit;
