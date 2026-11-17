
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\Api\SanBayController;
use App\Http\Controllers\Api\MayBayController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Middleware\AdminOnly;

// =====================================================
// 1. DANG NHAP
// Gioi han 5 lan dang nhap/phut
// =====================================================

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');


// =====================================================
// 2. API CONG KHAI - SAN BAY
// =====================================================

Route::get('/sanbay', [SanBayController::class, 'index']);
Route::get('/sanbay/{sanbay}', [SanBayController::class, 'show']);


// =====================================================
// 3. API CONG KHAI - MAY BAY
// =====================================================

Route::get('/maybay', [MayBayController::class, 'index']);
Route::get('/maybay/{id}', [MayBayController::class, 'show']);


// =====================================================
// 4. API CONG KHAI - HANG HANG KHONG
// =====================================================

Route::get('/hanghangkhong', function () {
    return response()->json([
        'success' => true,
        'data' => DB::table('HangHangKhong')
            ->orderBy('MaHang')
            ->get()
    ]);
});


// =====================================================
// 5. CAC API YEU CAU DANG NHAP SANCTUM
// =====================================================

Route::middleware('auth:sanctum')->group(function () {

    // Dang xuat
    Route::post('/logout', [AuthController::class, 'logout']);


    // =================================================
    // 6. CAC API CHI DANH CHO QUAN TRI VIEN
    // =================================================

    Route::middleware(AdminOnly::class)->group(function () {

        // ---------------------------------------------
        // CRUD SAN BAY
        // ---------------------------------------------

        Route::post('/sanbay', [SanBayController::class, 'store']);

        Route::put('/sanbay/{sanbay}', [SanBayController::class, 'update']);
        Route::patch('/sanbay/{sanbay}', [SanBayController::class, 'update']);

        Route::delete('/sanbay/{sanbay}', [SanBayController::class, 'destroy']);


        // ---------------------------------------------
        // CRUD MAY BAY
        // ---------------------------------------------

        Route::post('/maybay', [MayBayController::class, 'store']);

        Route::put('/maybay/{id}', [MayBayController::class, 'update']);
        Route::patch('/maybay/{id}', [MayBayController::class, 'update']);

        Route::delete('/maybay/{id}', [MayBayController::class, 'destroy']);


        // ---------------------------------------------
        // KIEM TRA DATABASE
        // ---------------------------------------------

        Route::get('/test-db', function () {

            $database = DB::connection()->getDatabaseName();

            $tables = DB::select("
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
            ");

            return response()->json([
                'success' => true,
                'database' => $database,
                'total_tables' => count($tables),
            ]);
        });


        // Danh sach bang trong database
        Route::get('/tables', function () {

            $tables = DB::select("
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            ");

            return response()->json($tables);
        });

    });

});
