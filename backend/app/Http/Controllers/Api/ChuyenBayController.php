<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class ChuyenBayController extends Controller
{
    // 1. DANH SACH CHUYEN BAY
    public function index()
    {
        $data = DB::table('ChuyenBay')
            ->join(
                'HangHangKhong',
                'ChuyenBay.MaHang',
                '=',
                'HangHangKhong.MaHang'
            )
            ->leftJoin(
                'MayBay',
                'ChuyenBay.MaMayBay',
                '=',
                'MayBay.MaMayBay'
            )
            ->join(
                'SanBay as SanBayDi',
                'ChuyenBay.MaSanBayDi',
                '=',
                'SanBayDi.MaSanBay'
            )
            ->join(
                'SanBay as SanBayDen',
                'ChuyenBay.MaSanBayDen',
                '=',
                'SanBayDen.MaSanBay'
            )
            ->select(
                'ChuyenBay.*',
                'HangHangKhong.TenHang',
                'MayBay.DongMay',
                'SanBayDi.TenSanBay as TenSanBayDi',
                'SanBayDen.TenSanBay as TenSanBayDen'
            )
            ->orderBy('ChuyenBay.GioKhoiHanh')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // 2. CHI TIET CHUYEN BAY
    public function show($id)
    {
        $data = DB::table('ChuyenBay')
            ->join(
                'HangHangKhong',
                'ChuyenBay.MaHang',
                '=',
                'HangHangKhong.MaHang'
            )
            ->leftJoin(
                'MayBay',
                'ChuyenBay.MaMayBay',
                '=',
                'MayBay.MaMayBay'
            )
            ->join(
                'SanBay as SanBayDi',
                'ChuyenBay.MaSanBayDi',
                '=',
                'SanBayDi.MaSanBay'
            )
            ->join(
                'SanBay as SanBayDen',
                'ChuyenBay.MaSanBayDen',
                '=',
                'SanBayDen.MaSanBay'
            )
            ->select(
                'ChuyenBay.*',
                'HangHangKhong.TenHang',
                'HangHangKhong.MaIATA',
                'MayBay.DongMay',
                'MayBay.SoDangKy',
                'SanBayDi.TenSanBay as TenSanBayDi',
                'SanBayDi.MaIATA as IATADi',
                'SanBayDen.TenSanBay as TenSanBayDen',
                'SanBayDen.MaIATA as IATADen'
            )
            ->where('ChuyenBay.MaChuyenBay', $id)
            ->first();

        if (!$data) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay chuyen bay.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // 3. THEM CHUYEN BAY
    public function store(Request $request)
    {
        $validated = $request->validate([
            'MaHang' => 'required|integer|exists:HangHangKhong,MaHang',

            'MaMayBay' => 'nullable|integer|exists:MayBay,MaMayBay',

            'SoHieuChuyenBay' => 'required|string|max:40',

            'MaSanBayDi' => 'required|integer|exists:SanBay,MaSanBay',

            'MaSanBayDen' => 'required|integer|different:MaSanBayDi|exists:SanBay,MaSanBay',

            'GioKhoiHanh' => 'required|date',

            'GioDen' => 'required|date|after:GioKhoiHanh',

            'TrangThai' => 'required|in:DaLenLich,DaKhoiHanh,TreGio,DaDen,DaHuy'
        ]);

        try {
    // Chuyen datetime-local sang dinh dang SQL Server
    $validated['GioKhoiHanh'] = date(
        'Y-m-d H:i:s',
        strtotime($validated['GioKhoiHanh'])
    );

    $validated['GioDen'] = date(
        'Y-m-d H:i:s',
        strtotime($validated['GioDen'])
    );

    $id = DB::table('ChuyenBay')->insertGetId(
        $validated,
        'MaChuyenBay'
    );

        } catch (QueryException $e) {

            // GHI CHI TIET LOI SQL VAO LARAVEL LOG
            Log::error('LOI THEM CHUYEN BAY', [
                'message' => $e->getMessage(),
                'sql_state' => $e->errorInfo[0] ?? null,
                'driver_code' => $e->errorInfo[1] ?? null,
                'driver_message' => $e->errorInfo[2] ?? null,
                'payload' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Khong the them chuyen bay. Vui long kiem tra du lieu.',
                'debug' => config('app.debug')
                    ? $e->getMessage()
                    : null
            ], 409);
        }
    }

    // 4. CAP NHAT CHUYEN BAY
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'MaHang' => 'required|integer|exists:HangHangKhong,MaHang',

            'MaMayBay' => 'nullable|integer|exists:MayBay,MaMayBay',

            'SoHieuChuyenBay' => 'required|string|max:40',

            'MaSanBayDi' => 'required|integer|exists:SanBay,MaSanBay',

            'MaSanBayDen' => 'required|integer|different:MaSanBayDi|exists:SanBay,MaSanBay',

            'GioKhoiHanh' => 'required|date',

            'GioDen' => 'required|date|after:GioKhoiHanh',

            'TrangThai' => 'required|in:DaLenLich,DaKhoiHanh,TreGio,DaDen,DaHuy'
        ]);

        $exists = DB::table('ChuyenBay')
            ->where('MaChuyenBay', $id)
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay chuyen bay.'
            ], 404);
        }

        try {
    // Chuyen datetime-local sang dinh dang SQL Server
    $validated['GioKhoiHanh'] = date(
        'Y-m-d H:i:s',
        strtotime($validated['GioKhoiHanh'])
    );

    $validated['GioDen'] = date(
        'Y-m-d H:i:s',
        strtotime($validated['GioDen'])
    );

    DB::table('ChuyenBay')
        ->where('MaChuyenBay', $id)
        ->update($validated);

        } catch (QueryException $e) {

            Log::error('LOI CAP NHAT CHUYEN BAY', [
                'id' => $id,
                'message' => $e->getMessage(),
                'sql_state' => $e->errorInfo[0] ?? null,
                'driver_code' => $e->errorInfo[1] ?? null,
                'driver_message' => $e->errorInfo[2] ?? null,
                'payload' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Khong the cap nhat chuyen bay.',
                'debug' => config('app.debug')
                    ? $e->getMessage()
                    : null
            ], 409);
        }
    }

    // 5. XOA CHUYEN BAY
    public function destroy($id)
    {
        $exists = DB::table('ChuyenBay')
            ->where('MaChuyenBay', $id)
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay chuyen bay.'
            ], 404);
        }

        try {
            DB::table('ChuyenBay')
                ->where('MaChuyenBay', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xoa chuyen bay thanh cong.'
            ]);

        } catch (QueryException $e) {

            Log::error('LOI XOA CHUYEN BAY', [
                'id' => $id,
                'message' => $e->getMessage(),
                'sql_state' => $e->errorInfo[0] ?? null,
                'driver_code' => $e->errorInfo[1] ?? null,
                'driver_message' => $e->errorInfo[2] ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Chuyen bay dang co du lieu dat ve, khong the xoa.',
                'debug' => config('app.debug')
                    ? $e->getMessage()
                    : null
            ], 409);
        }
    }
}
