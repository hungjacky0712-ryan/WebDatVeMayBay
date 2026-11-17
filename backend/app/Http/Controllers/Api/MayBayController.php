<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

class MayBayController extends Controller
{
    // =========================================
    // 1. DANH SACH MAY BAY
    // =========================================
    public function index()
    {
        $data = DB::table('MayBay')
            ->join(
                'HangHangKhong',
                'MayBay.MaHang',
                '=',
                'HangHangKhong.MaHang'
            )
            ->select(
                'MayBay.MaMayBay',
                'MayBay.MaHang',
                'MayBay.DongMay',
                'MayBay.SoDangKy',
                'MayBay.TongSoGhe',
                'HangHangKhong.TenHang',
                'HangHangKhong.MaIATA'
            )
            ->orderBy('MayBay.MaMayBay')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // =========================================
    // 2. CHI TIET MAY BAY
    // =========================================
    public function show($id)
    {
        $data = DB::table('MayBay')
            ->join(
                'HangHangKhong',
                'MayBay.MaHang',
                '=',
                'HangHangKhong.MaHang'
            )
            ->select(
                'MayBay.MaMayBay',
                'MayBay.MaHang',
                'MayBay.DongMay',
                'MayBay.SoDangKy',
                'MayBay.TongSoGhe',
                'HangHangKhong.TenHang',
                'HangHangKhong.MaIATA'
            )
            ->where('MayBay.MaMayBay', $id)
            ->first();

        if (!$data) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay may bay.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // =========================================
    // 3. THEM MAY BAY
    // =========================================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'MaHang' => 'required|integer|exists:HangHangKhong,MaHang',
            'DongMay' => 'required|string|max:50',
            'SoDangKy' => 'required|string|max:20',
            'TongSoGhe' => 'required|integer|min:1'
        ]);

        try {
            $id = DB::table('MayBay')->insertGetId(
                $validated,
                'MaMayBay'
            );

            return response()->json([
                'success' => true,
                'message' => 'Them may bay thanh cong.',
                'MaMayBay' => $id
            ], 201);

        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Khong the them may bay. Vui long kiem tra du lieu.'
            ], 409);
        }
    }

    // =========================================
    // 4. CAP NHAT MAY BAY
    // =========================================
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'MaHang' => 'required|integer|exists:HangHangKhong,MaHang',
            'DongMay' => 'required|string|max:50',
            'SoDangKy' => 'required|string|max:20',
            'TongSoGhe' => 'required|integer|min:1'
        ]);

        $exists = DB::table('MayBay')
            ->where('MaMayBay', $id)
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay may bay.'
            ], 404);
        }

        try {
            DB::table('MayBay')
                ->where('MaMayBay', $id)
                ->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cap nhat may bay thanh cong.'
            ]);

        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Khong the cap nhat may bay.'
            ], 409);
        }
    }

    // =========================================
    // 5. XOA MAY BAY
    // =========================================
    public function destroy($id)
    {
        $exists = DB::table('MayBay')
            ->where('MaMayBay', $id)
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay may bay.'
            ], 404);
        }

        try {
            DB::table('MayBay')
                ->where('MaMayBay', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xoa may bay thanh cong.'
            ]);

        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'May bay dang duoc su dung, khong the xoa.'
            ], 409);
        }
    }
}
