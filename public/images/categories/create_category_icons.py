from PIL import Image, ImageDraw, ImageFont
import os

# 定义分类和对应的emoji
categories = {
    'fruit': ('🍹', '果茶', '#FF6B6B'),
    'coffee': ('☕', '咖啡', '#8B4513'),
    'snack': ('🍿', '小吃', '#FFA500'),
    'tea': ('🍵', '奶茶', '#00CED1'),
    'milktea': ('🧋', '奶茶', '#FF69B4'),
    'ice': ('🍦', '冰品', '#87CEEB'),
    'dessert': ('🍰', '甜点', '#FFB6C1'),
    'breakfast': ('🍳', '早餐', '#FFD700'),
}

# 设置图标尺寸
size = 64
font_size = 40

# 创建输出目录
output_dir = 'f:\\奶茶店小程序\\backend\\public\\images\\categories'
os.makedirs(output_dir, exist_ok=True)

# 为每个分类创建图标
for category_name, (emoji, chinese_name, color) in categories.items():
    # 创建透明背景的图像
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 尝试使用系统字体支持emoji，如果失败则使用默认字体
    try:
        # Windows系统emoji字体路径
        font_path = 'C:\\Windows\\Fonts\\seguiemj.ttf'
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, font_size)
        else:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    # 计算文本位置（居中）
    bbox = draw.textbbox((0, 0), emoji, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2)

    # 绘制emoji
    draw.text(position, emoji, font=font, fill=(0, 0, 0, 255))

    # 保存为PNG
    output_path = os.path.join(output_dir, f'{category_name}.png')
    img.save(output_path, 'PNG')
    print(f'Created: {output_path}')

print('All category icons created successfully!')
