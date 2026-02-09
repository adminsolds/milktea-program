package com.milktea.pos.hardware.printer

import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderItem
import java.nio.charset.Charset
import java.text.SimpleDateFormat
import java.util.*

/**
 * 标签构建器
 * 生成杯贴标签的 ESC/POS 指令数据
 */
class LabelBuilder {

    companion object {
        private val ESC = 0x1B.toByte()
        private val GS = 0x1D.toByte()
        private val LF = 0x0A.toByte()
    }

    private val buffer = mutableListOf<Byte>()
    private val charset = Charset.forName("GBK")

    /**
     * 构建杯贴标签
     * @param order 订单信息
     * @param item 商品项
     * @param currentIndex 当前杯数
     * @param totalCount 总杯数
     */
    fun buildLabel(
        order: Order,
        item: OrderItem,
        currentIndex: Int,
        totalCount: Int
    ): ByteArray {
        buffer.clear()

        // 初始化打印机
        initPrinter()

        // 设置标签尺寸（40x30mm 标签纸）
        setLabelSize()

        // 订单号（大号字体）
        setSize(2, 2)
        setBold(true)
        addText("#${order.orderNo.takeLast(4)}")
        setBold(false)
        setSize(1, 1)
        lineFeed()

        // 杯数标记
        setSize(2, 2)
        addText("$currentIndex/$totalCount")
        setSize(1, 1)
        lineFeed(2)

        // 商品名称
        setBold(true)
        setSize(1, 2)
        val specText = if (item.specName != null) "(${item.specName})" else ""
        addText(item.productName + specText)
        setSize(1, 1)
        setBold(false)
        lineFeed(2)

        // 定制选项
        val options = mutableListOf<String>()
        if (item.sugar != null) options.add(item.sugar)
        if (item.ice != null) options.add(item.ice)
        if (!item.toppings.isNullOrEmpty()) {
            options.add(item.toppings)
        }

        if (options.isNotEmpty()) {
            setSize(1, 2)
            options.forEachIndexed { index, option ->
                if (index > 0) addText(" / ")
                addText(option)
            }
            setSize(1, 1)
            lineFeed(2)
        }

        // 备注
        if (!item.remark.isNullOrBlank()) {
            addText("【备注】${item.remark}")
            lineFeed()
        }

        // 时间
        lineFeed()
        val dateFormat = SimpleDateFormat("HH:mm", Locale.CHINA)
        val date = try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")
            inputFormat.parse(order.createdAt ?: "") ?: Date()
        } catch (e: Exception) {
            Date()
        }
        addText(dateFormat.format(date))

        // 订单类型标记
        val orderTypeText = when (order.orderType) {
            "self" -> " 堂食"
            "pickup" -> " 自取"
            "delivery" -> " 外卖"
            else -> ""
        }
        addText(orderTypeText)

        // 结束打印
        lineFeed(2)
        cutPaper()

        return buffer.toByteArray()
    }

    /**
     * 构建简单标签（用于测试）
     */
    fun buildTestLabel(): ByteArray {
        buffer.clear()
        initPrinter()
        setLabelSize()

        alignCenter()
        setSize(2, 2)
        setBold(true)
        addText("测试标签")
        setBold(false)
        setSize(1, 1)
        lineFeed(2)

        alignLeft()
        addText("打印机测试")
        lineFeed()
        addText("时间：${SimpleDateFormat("HH:mm:ss", Locale.CHINA).format(Date())}")
        lineFeed(2)

        cutPaper()
        return buffer.toByteArray()
    }

    /**
     * 设置标签尺寸
     */
    private fun setLabelSize() {
        // 设置页面模式（标签模式）
        buffer.add(ESC)
        buffer.add(0x4C)  // L - 进入页面模式
    }

    /**
     * 添加文本
     */
    private fun addText(text: String) {
        buffer.addAll(text.toByteArray(charset).toList())
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
     * 初始化打印机
     */
    private fun initPrinter() {
        buffer.add(ESC)
        buffer.add(0x40)  // @ - 初始化
    }

    /**
     * 左对齐
     */
    private fun alignLeft() {
        buffer.add(ESC)
        buffer.add(0x61)  // a
        buffer.add(0x00)  // 0 - 左对齐
    }

    /**
     * 居中对齐
     */
    private fun alignCenter() {
        buffer.add(ESC)
        buffer.add(0x61)  // a
        buffer.add(0x01)  // 1 - 居中
    }

    /**
     * 设置加粗
     */
    private fun setBold(bold: Boolean) {
        buffer.add(ESC)
        buffer.add(0x45)  // E
        buffer.add(if (bold) 0x01 else 0x00)
    }

    /**
     * 设置字体大小
     */
    private fun setSize(width: Int, height: Int) {
        val size = ((width - 1) shl 4) or (height - 1)
        buffer.add(GS)
        buffer.add(0x21)  // !
        buffer.add(size.toByte())
    }

    /**
     * 切纸
     */
    private fun cutPaper() {
        buffer.add(GS)
        buffer.add(0x56)  // V
        buffer.add(0x00)  // 全切
    }
}
