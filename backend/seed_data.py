import asyncio
import datetime
import sys
import io
from sqlalchemy import select, delete

# Ensure UTF-8 output in Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.models import Category, Product, FAQ, NewsPost, AppSetting, BotUser, Order, OrderItem, CartItem, ChatMessage, BroadcastLog

async def seed_restaurant_data():
    print("🍲 Initializing Restaurant Database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Clear existing menu/faqs/news for fresh restaurant experience
        await session.execute(delete(Product))
        await session.execute(delete(Category))
        await session.execute(delete(FAQ))
        await session.execute(delete(NewsPost))
        await session.execute(delete(OrderItem))
        await session.execute(delete(Order))
        await session.commit()

        # 1. Restaurant Settings
        settings_data = [
            ("STORE_NAME", "ရွှေမန္တလေး စားသောက်ဆိုင် (Shwe Mandalay)", "Restaurant Brand Name"),
            ("CURRENCY", "MMK", "Default Currency"),
            ("KPAY_NUMBER", "09-789123456 (Daw Hla Hla - Shwe Mandalay)", "KBZPay Account"),
            ("WAVEPAY_NUMBER", "09-789123456 (Daw Hla Hla - Shwe Mandalay)", "WavePay Account"),
        ]
        for key, val, desc in settings_data:
            res = await session.execute(select(AppSetting).where(AppSetting.key == key))
            setting = res.scalar_one_or_none()
            if setting:
                setting.value = val
            else:
                session.add(AppSetting(key=key, value=val, description=desc))

        # 2. Restaurant Categories
        cat_main = Category(name="အဓိက ဟင်းလျာများ", description="Main Dishes & Rice", icon="🍲")
        cat_snack = Category(name="အကြော်နှင့် အမြည်းများ", description="Snacks & Appetizers", icon="🍢")
        cat_drink = Category(name="အဖျော်ယမကာနှင့် အအေး", description="Beverages & Fresh Drinks", icon="🥤")
        cat_dessert = Category(name="အချိုပွဲများ", description="Desserts & Sweets", icon="🍨")
        
        session.add_all([cat_main, cat_snack, cat_drink, cat_dessert])
        await session.flush()

        # 3. Delicious Restaurant Items
        items = [
            # Main Dishes
            Product(
                category_id=cat_main.id,
                name="ကြက်သား ကုန်းဘောင်ကြီးကြော် (Kung Pao Chicken)",
                description="ကြက်သားအရသာစစ်စစ်ကို သီဟိုဠ်စေ့၊ ငရုတ်သီးခြောက်တို့ဖြင့် မွှေးကြိုင်စွာ ကြော်လှော်ထားသော လူကြိုက်အများဆုံး ဟင်းလျာ",
                price=9500.0,
                stock=50,
                image_url="https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),
            Product(
                category_id=cat_main.id,
                name="ဝက်နံရိုး ချိုချဉ်ကြော် (Sweet & Sour Pork Ribs)",
                description="နူးအိနေသော ဝက်နံရိုးများကို နာနတ်သီး၊ ခရမ်းချဉ်သီး ချိုချဉ်ဆော့စ်ဖြင့် အရသာစုံလင်စွာ ချက်ပြုတ်ထားပါသည်",
                price=12000.0,
                stock=40,
                image_url="https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),
            Product(
                category_id=cat_main.id,
                name="ပင်လယ်စာ ထမင်းကြော် (Seafood Fried Rice)",
                description="ပုစွန်၊ ကင်းမွန် အစုံပါဝင်သော ထမင်းကြော်ပူပူမွှေးမွှေး (ကြက်ဥကြော် အပိုထည့်နိုင်ပါသည်)",
                price=8500.0,
                stock=60,
                image_url="https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),
            Product(
                category_id=cat_main.id,
                name="ရှမ်းခေါက်ဆွဲ အထူးပွဲ (Special Shan Noodle)",
                description="ရှမ်းပြည်ဒေသထွက် ဆန်စီးခေါက်ဆွဲစစ်စစ်ကို ကြက်သား/ဝက်သား ဟင်းအနှစ်၊ မြေပဲဆုံမွှေးတို့ဖြင့် တွဲဖက်သုံးဆောင်နိုင်ပါသည်",
                price=5500.0,
                stock=80,
                image_url="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),

            # Snacks
            Product(
                category_id=cat_snack.id,
                name="ကြက်တောင်ပံ ကြွပ်ကြွပ်ကြော် (Crispy Chicken Wings)",
                description="အပြင်ကြွပ် အတွင်းနူး အရသာအပြည့်ပါဝင်သော စားမြိန်ဖွယ် ကြက်တောင်ပံကြော် (၆ တုံးတွဲ)",
                price=7500.0,
                stock=45,
                image_url="https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),
            Product(
                category_id=cat_snack.id,
                name="ရွှေငါး ဖက်ထုပ်ကြော် (Crispy Pork & Shrimp Dumplings)",
                description="ဝက်သားနှင့် ပုစွန်အဆာသွပ်ထားသော ရွှေဝါရောင် ဖက်ထုပ်ကြော် (ချိုချဉ်အချဉ်ရည် ပါဝင်သည်)",
                price=6000.0,
                stock=50,
                image_url="https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),
            Product(
                category_id=cat_snack.id,
                name="အာလူးချောင်းကြော် (French Fries with Dip)",
                description="ကလေးလူကြီး အားလုံးကြိုက်နှစ်သက်သော ဆော့စ်စုံပါ အာလူးချောင်းကြော်",
                price=4500.0,
                stock=70,
                image_url="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),

            # Drinks
            Product(
                category_id=cat_drink.id,
                name="ထောပတ်သီးဖျော်ရည် (Fresh Avocado Smoothie)",
                description="ရှမ်းပြည်နယ်ထွက် သဘာဝ ထောပတ်သီးစစ်စစ်ကို နို့စိမ်း၊ နို့ဆီတို့ဖြင့် ချိုဆိမ့်အေးမြစွာ ဖျော်စပ်ထားပါသည်",
                price=4500.0,
                stock=100,
                image_url="https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),
            Product(
                category_id=cat_drink.id,
                name="သံပုရာ ရေခဲလက်ဖက်ရည် (Iced Lemon Tea)",
                description="လတ်ဆတ်သော သံပုရာသီးနှင့် လက်ဖက်ရည် အမွှေးအကြိုင်တို့ ပေါင်းစပ်ထားသော ရင်အေးစရာ အအေး",
                price=3500.0,
                stock=100,
                image_url="https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),
            Product(
                category_id=cat_drink.id,
                name="မန္တလေး လက်ဖက်ရည် ချိုကျ (Traditional Milk Tea)",
                description="မန္တလေးစတိုင် လက်ဖက်ရည်အဆိမ့်ကြိုက်သူများအတွက် အထူးသင့်လျော်ပါသည်",
                price=2500.0,
                stock=200,
                image_url="https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
                is_active=True
            ),

            # Desserts
            Product(
                category_id=cat_dessert.id,
                name="ရွှေရင်အေး အထူးပွဲ (Special Shwe Yin Aye)",
                description="ကျောက်ကျော၊ သာကူ၊ မုန့်လက်ဆောင်း၊ ကောက်ညှင်းပေါင်းနှင့် အုန်းနို့မွှေးမွှေးတို့ ပါဝင်သော ရိုးရာ အချိုပွဲ",
                price=4000.0,
                stock=60,
                image_url="https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80",
                is_active=True
            )
        ]
        session.add_all(items)

        # 4. Restaurant FAQs
        faqs = [
            FAQ(
                question="ဆိုင်ဖွင့်ချိန်နှင့် ပိတ်ချိန်က ဘယ်အချိန်တွေလဲ?",
                answer="ရွှေမန္တလေး စားသောက်ဆိုင်ကို နေ့စဉ် မနက် ၈:၀၀ နာရီမှ ည ၉:၃၀ နာရီအထိ ဖွင့်လှစ်ထားပါသည်ခင်ဗျာ။",
                category="ဆိုင်အချက်အလက်",
                order_index=1
            ),
            FAQ(
                question="အိမ်အရောက် Delivery ပို့ဆောင်ခ ဘယ်လောက်ကျပါသလဲ?",
                answer="ဆိုင်မှ ၃ မိုင်ပတ်လည်အတွင်း ပို့ခ ၂,၀၀၀ ကျပ်ဖြစ်ပြီး၊ အခြားမြို့နယ်များသို့ Delivery ဝန်ဆောင်မှုဖြင့် အိမ်အရောက် ပို့ဆောင်ပေးပါသည်ခင်ဗျာ။",
                category="Delivery",
                order_index=2
            ),
            FAQ(
                question="စားပွဲ ကြိုတင်ဘွတ်ကင် (Table Reservation) ပြုလုပ်လို့ ရပါသလား?",
                answer="ဟုတ်ကဲ့ ရပါသည်ခင်ဗျာ။ Support Menu မှ '👨‍💼 Support Admin နှင့် စကားပြောရန်' ကို နှိပ်ပြီး လူဦးရေနှင့် လာရောက်မည့် အချိန်ကို အသိပေး၍ ကြိုတင် စားပွဲဘွတ်ကင် ယူနိုင်ပါသည်။",
                category="Reservation",
                order_index=3
            ),
            FAQ(
                question="ဟင်းလျာများတွင် အစပ်လျော့ သို့မဟုတ် သက်သတ်လွတ် မှာယူနိုင်ပါသလား?",
                answer="မှာယူနိုင်ပါသည်ခင်ဗျာ။ အော်ဒါတင်ချိန် မှတ်ချက် (Notes) တွင် မိမိလိုချင်သော အရသာ သို့မဟုတ် သက်သတ်လွတ် ဖြစ်ကြောင်း ရေးသားပေးပို့နိုင်ပါသည်။",
                category="အထူးမှာယူမှု",
                order_index=4
            )
        ]
        session.add_all(faqs)

        # 5. Restaurant News & Special Deals
        news = [
            NewsPost(
                title="🔥 မိသားစု စားသုံးသူများအတွက် Family Set 15% လျှော့စျေး အထူးပရိုမိုးရှင်း",
                content="ကြက်ကုန်းဘောင်၊ ဝက်နံရိုးချိုချဉ်၊ ပင်လယ်စာထမင်းကြော်နှင့် အအေး ၄ ခွက် ပါဝင်သော Family Set ကို ၁၅% သက်သာသော စျေးနှုန်းဖြင့် မှာယူရရှိနိုင်ပါပြီ။ စျေးဝယ်ယူရန် '🛍️ ကုန်ပစ္စည်းများ' ကို နှိပ်ပါ။",
                image_url="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
                button_text="🍲 Menu ကြည့်မည်",
                button_url="https://t.me",
                is_published=True
            ),
            NewsPost(
                title="✨ အသစ်ထွက်ရှိသော သဘာဝ သစ်သီးဖျော်ရည်နှင့် အချိုပွဲ အသစ်များကို မြည်းစမ်းနိုင်ပါပြီ",
                content="ရှမ်းပြည်နယ်ထွက် သဘာဝထောပတ်သီးဖျော်ရည်နှင့် နာမည်ကြီး ရွှေရင်အေးအထူးပွဲတို့ကို ဆိုင်တွင် စိတ်ကြိုက် သုံးဆောင်နိုင်ပါပြီဖြစ်ကြောင်း သတင်းကောင်းပါးအပ်ပါသည်။",
                image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
                is_published=True
            )
        ]
        session.add_all(news)

        # 6. Sample Restaurant Order
        demo_user = BotUser(
            telegram_id=987654321,
            username="mg_kyaw_foodie",
            first_name="မောင်ကျော်",
            last_name="",
            phone="09771122334",
            is_blocked=False,
            created_at=datetime.datetime.now(datetime.timezone.utc),
            last_active=datetime.datetime.now(datetime.timezone.utc)
        )
        session.add(demo_user)
        await session.flush()

        demo_order = Order(
            order_code="ORD-RESTO01",
            user_id=demo_user.id,
            customer_name="ကိုကျော် (မောင်ကျော်)",
            customer_phone="09771122334",
            delivery_address="အခန်း ၃၀၂၊ တိုက် ၅၊ သမိန်ဗရမ်းလမ်း၊ တာမွေမြို့နယ်၊ ရန်ကုန်",
            total_amount=18000.0,
            payment_method="KPay",
            status="Pending",
            notes="ကြက်ကုန်းဘောင် အစပ်လျော့ပေးပါခင်ဗျာ",
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        session.add(demo_order)
        await session.flush()

        session.add(OrderItem(
            order_id=demo_order.id,
            product_name="ကြက်သား ကုန်းဘောင်ကြီးကြော် (Kung Pao Chicken)",
            price=9500.0,
            quantity=1,
            subtotal=9500.0
        ))
        session.add(OrderItem(
            order_id=demo_order.id,
            product_name="ပင်လယ်စာ ထမင်းကြော် (Seafood Fried Rice)",
            price=8500.0,
            quantity=1,
            subtotal=8500.0
        ))

        await session.commit()
        print("✅ Restaurant database initialized with food menu, snacks, drinks, desserts, and FAQs!")

if __name__ == "__main__":
    asyncio.run(seed_restaurant_data())
