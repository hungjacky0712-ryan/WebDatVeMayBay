<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
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
        $id = DB::table('ChuyenBay')->insertGetId(
            $validated,
            'MaChuyenBay'
        );

        return response()->json([
            'success' => true,
            'message' => 'Them chuyen bay thanh cong.',
            'MaChuyenBay' => $id
        ], 201);

    } catch (QueryException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Khong the them chuyen bay. Vui long kiem tra du lieu.'
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
        DB::table('ChuyenBay')
            ->where('MaChuyenBay', $id)
            ->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cap nhat chuyen bay thanh cong.'
        ]);

    } catch (QueryException $e) {

    \Log::error('LOI CAP NHAT CHUYEN BAY: ' . $e->getMessage());

    return response()->json([
        'success' => false,
        'message' => 'Khong the cap nhat chuyen bay.'
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
        return response()->json([
            'success' => false,
            'message' => 'Chuyen bay dang co du lieu dat ve, khong the xoa.'
        ], 409);
    }
}
}