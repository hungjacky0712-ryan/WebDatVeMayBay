
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// Kiểm tra kết nối SQL Server
Route::get('/test-db', function () {
    $database = DB::connection()->getDatabaseName();

    $tables = DB::select("
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
    ");

    return response()->json([
        'success' => true,
        'message' => 'Laravel ket noi SQL Server thanh cong!',
        'database' => $database,
        'total_tables' => count($tables),
    ]);
});

// Lấy danh sách bảng trong database
Route::get('/tables', function () {
    $tables = DB::select("
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    ");

    return response()->json($tables);
});
