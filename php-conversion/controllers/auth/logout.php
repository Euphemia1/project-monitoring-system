<?php
session_start();
session_destroy();

// Redirect to login page
header('Location: login.php?message=logged_out');
exit;
?>