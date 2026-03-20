package com.nhom55.myapplication

data class TenantApiModel(
    val id_nguoi_thue: Int,
    val ho_ten: String,
    val cccd: String,
    val so_dien_thoai: String,
    val email: String,
    val ngay_vao: String,
    val ngay_ra: String?,
    val id_tai_khoan: Int?
)

data class Tenant(
    val id: String,
    val name: String,
    val identityCard: String,
    val phone: String,
    val email: String,
    val moveInDate: String,
    val moveOutDate: String?
)

fun TenantApiModel.toTenant(): Tenant {
    return Tenant(
        id = id_nguoi_thue.toString(),
        name = ho_ten,
        identityCard = cccd,
        phone = so_dien_thoai,
        email = email,
        moveInDate = ngay_vao,
        moveOutDate = ngay_ra
    )
}
