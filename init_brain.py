import sqlite3

DB_NAME = "brain.db"

def init_brain():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # 1. Tạo bảng knowledge (bài học, insight)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS knowledge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Tạo bảng business (sản phẩm, khách hàng)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS business (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 3. Tạo bảng brand_voice (giọng văn, tone, style)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brand_voice (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    sample_knowledge = [
        (
            "Nguyên tắc 80/20 trong sáng tạo nội dung",
            "80% giá trị nằm ở 20% ý tưởng cốt lõi. Hãy tập trung giải quyết đúng nỗi đau lớn nhất của độc giả thay vì dàn trải nội dung."
        ),
        (
            "Insight về hành vi khách hàng số",
            "Khách hàng không mua tính năng của sản phẩm, họ mua phiên bản tốt hơn của chính họ khi sử dụng sản phẩm đó."
        )
    ]

    sample_business = [
        (
            "CostcoHealth USA - Hàng Mỹ Xách Tay Chuẩn Air",
            "Chuyên thực phẩm chức năng chính hãng mua trực tiếp tại siêu thị Costco Mỹ kèm hóa đơn gốc, vận chuyển 100% bằng đường hàng không (Bay Air) giữ trọn dược tính."
        ),
        (
            "Chân dung khách hàng mục tiêu",
            "Người con 28-45 tuổi mua quà báo hiếu sức khỏe cho bố mẹ ở quê (xương khớp, tim mạch); dân văn phòng 25-38 tuổi ngồi máy tính nhiều (khô mắt, mỏi khớp, rụng tóc); phụ nữ chăm sóc da và chống lão hóa."
        )
    ]

    sample_brand_voice = [
        (
            "Tone của tôi",
            "Gần gũi, thẳng thắn, không dùng từ hoa mỹ, hay dùng câu ngắn."
        ),
        (
            "Tôi hay dùng những từ như",
            "'thật ra', 'đơn giản thôi', 'thử xem', 'không cần phức tạp', 'dùng' (thay vì 'xài')"
        ),
        (
            "Tôi không bao giờ dùng",
            "'synergy', 'leverage', 'tối ưu hóa trải nghiệm', từ quá corporate, sáo rỗng, 'xài'"
        ),
        (
            "Tôi đang viết cho",
            "Người đi làm 25-35 tuổi và con cái muốn tìm giải pháp sức khỏe an tâm cho gia đình và bản thân."
        ),
        (
            "Ví dụ bài viết tôi thấy đúng giọng nhất",
            """Chào mn,
Thật ra, bán đồ Mỹ sợ nhất không phải là ế, mà là sợ khách nghi ngờ nguồn gốc.
Đồ uống vào người thì phải rõ ràng từng đồng từng cọng. Mình chọn cách làm cực nhất nhưng an tâm nhất: người nhà bên Cali tự đẩy xe vào quầy Costco mua, từng món có hóa đơn giấy in rõ ngày giờ, gửi bay Air hỏa tốc về Việt Nam.
Đơn giản thôi, sức khỏe gia đình là trên hết."""
        )
    ]

    for title, content in sample_knowledge:
        cursor.execute("SELECT id FROM knowledge WHERE title = ?", (title,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO knowledge (title, content) VALUES (?, ?)", (title, content))

    for title, content in sample_business:
        cursor.execute("SELECT id FROM business WHERE title = ?", (title,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO business (title, content) VALUES (?, ?)", (title, content))

    for title, content in sample_brand_voice:
        cursor.execute("SELECT id FROM brand_voice WHERE title = ?", (title,))
        row = cursor.fetchone()
        if row:
            cursor.execute("UPDATE brand_voice SET content = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", (content, row[0]))
        else:
            cursor.execute("INSERT INTO brand_voice (title, content) VALUES (?, ?)", (title, content))

    conn.commit()
    conn.close()
    print("SUCCESS")

if __name__ == "__main__":
    init_brain()
