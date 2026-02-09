package com.milktea.pos.hardware.printer

import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderItem
import java.nio.charset.Charset
import java.text.SimpleDateFormat
import java.util.*

/**
 * 小票构建器
 * 生成 ESC/POS 指令格式的小票数据
 */
class ReceiptBuilder {

    companion object {
        private val ESC = 0x1B.toByte()
        private val GS = 0x1D.toByte()
        private val LF = 0x0A.toByte()
        private val NUL = 0x00.toByte()
    }

    private val buffer = mutableListOf<Byte>()
    private val charset = Charset.forName("GBK")

    /**
     * 构建小票
     */
    fun buildReceipt(order: Order): ByteArray {
        buffer.clear()

        // 初始化打印机
        initPrinter()

        // 打印标题
        alignCenter()
        setBold(true)
        setSize(2, 2)
        addText("半夏奶茶店")
        setSize(1, 1)
        setBold(false)
        lineFeed()

        // 订单类型
        val orderTypeText = when (order.orderType) {
            "self" -> "【堂食】"
            "pickup" -> "【自取】"
            "delivery" -> "【外卖】"
            else -> "【堂食】"
        }
        addText(orderTypeText)
        lineFeed(2)

        // 分隔线
        addLine()

        // 订单信息
        alignLeft()
        addText("订单号：${order.orderNo}")
        lineFeed()

        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.CHINA)
        val date = try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")
            inputFormat.parse(order.createdAt ?: "") ?: Date()
        } catch (e: Exception) {
            Date()
        }
        addText("时间：${dateFormat.format(date)}")
        lineFeed()

        // 会员信息
        if (order.userPhone != null) {
            addText("会员：${order.userName ?: order.userPhone}")
            lineFeed()
        }

        // 分隔线
        addLine()

        // 商品列表
        addText("商品名称        数量    金额")
        lineFeed()
        addLine("-")

        order.items.forEach { item ->
            printOrderItem(item)
        }

        // 分隔线
        addLine()

        // 金额明细
        addText("商品金额：${String.format("%10.2f", order.productTotal)}")
        lineFeed()

        if (order.memberDiscount > 0) {
            addText("会员优惠：${String.format("%10.2f", -order.memberDiscount)}")
            lineFeed()
        }

        if (order.couponDiscount > 0) {
            addText("优惠券：${String.format("%11.2f", -order.couponDiscount)}")
            lineFeed()
        }

        // 分隔线
        addLine()

        // 合计
        setBold(true)
        setSize(1, 2)
        addText("合计：${String.format("%12.2f", order.finalPrice)}")
        setSize(1, 1)
        setBold(false)
        lineFeed(2)

        // 支付方式
        val paymentText = when (order.paymentMethod) {
            "cash" -> "现金支付"
            "wechat" -> "微信支付"
            "alipay" -> "支付宝"
            "wallet" -> "储值支付"
            else -> "其他支付"
        }
        addText("支付方式：$paymentText")
        lineFeed(2)

        // 备注
        if (!order.remark.isNullOrBlank()) {
            addText("备注：${order.remark}")
            lineFeed()
        }

        // 分隔线
        addLine()

        // 底部信息
        alignCenter()
        addText("欢迎光临，谢谢惠顾！")
        lineFeed()
        addText("请妥善保管小票，作为取餐凭证")
        lineFeed(3)

        // 切纸
        cutPaper()

        return buffer.toByteArray()
    }

    /**
     * 打印商品项
     */
    private fun printOrderItem(item: OrderItem) {
        // 商品名称（规格）
        val specText = if (item.specName != null) "(${item.specName})" else ""
        val name = item.productName + specText

        // 如果名称太长，截断
        val displayName = if (name.length > 12) {
            name.substring(0, 12) + "..."
        } else {
            name
        }

        addText(displayName)

        // 对齐数量
        val spaceCount = 16 - displayName.length
        repeat(spaceCount) { addText(" ") }
        addText("${item.quantity}")

        // 对齐金额
        val amountSpace = 8 - String.format("%.2f", item.totalPrice).length
        repeat(amountSpace) { addText(" ") }
        addText(String.format("%.2f", item.totalPrice))
        lineFeed()

        // 定制选项
        val options = mutableListOf<String>()
        if (item.sugar != null) options.add(item.sugar)
        if (item.ice != null) options.add(item.ice)
        if (!item.toppings.isNullOrEmpty()) {
            options.add(item.toppings)
        }

        if (options.isNotEmpty()) {
            addText("  ${options.joinToString(" / ")}")
            lineFeed()
        }
    }

    /**
     * 初始化打印机
     */
    private fun initPrinter() {
        buffer.add(ESC)
        buffer.add(0x40) // 初始化
    }

    /**
     * 左对齐
     */
    private fun alignLeft() {
        buffer.add(ESC)
        buffer.add(0x61)
        buffer.add(0x00)
    }

    /**
     * 居中对齐
     */
    private fun alignCenter() {
        buffer.add(ESC)
        buffer.add(0x61)
        buffer.add(0x01)
    }

    /**
     * 右对齐
     */
    private fun alignRight() {
        buffer.add(ESC)
        buffer.add(0x61)
        buffer.add(0x02)
    }

    /**
     * 设置字体大小
     * width: 1-8
     * height: 1-8
     */
    private fun setSize(width: Int, height: Int) {
        buffer.add(GS)
        buffer.add(0x21)
        buffer.add(((width - 1) * 16 + (height - 1)).toByte())
    }

    /**
     * 设置加粗
     */
    private fun setBold(bold: Boolean) {
        buffer.add(ESC)
        buffer.add(0x45)
        buffer.add(if (bold) 0x01 else 0x00)
    }

    /**
     * 添加文本
     */
    private fun addText(text: String) {
        val bytes = text.toByteArray(charset)
        buffer.addAll(bytes.toList())
    }

    /**
     * 换行
     */
    private fun lineFeed(count: Int = 1) {
        repeat(count) {
            buffer.add(LF)
        }
    }

    /**
     * 添加分隔线
     */
    private fun addLine(char: String = "=") {
        repeat(32) { addText(char) }
        lineFeed()
    }

    /**
     * 切纸
     */
    private fun cutPaper() {
        buffer.add(GS)
        buffer.add(0x56)
        buffer.add(0x00)
    }
}
