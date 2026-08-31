# 🤖 Telegram Omni Bot & Modern Admin Dashboard

Python FastAPI နှင့် React တို့ဖြင့် တည်ဆောက်ထားသော **Telegram All-in-One Bot & Admin Web Panel** ဖြစ်ပါသည်။
**E-commerce (Shop)**၊ **Customer Service (Live Support Chat & FAQ)**၊ **Info & News** နှင့် **Broadcast Messaging** လုပ်ဆောင်ချက်များ အစုံအလင် ပါဝင်ပါသည်။

---

## 🌟 အဓိက လုပ်ဆောင်ချက်များ (Key Features)

### ၁။ Telegram Bot အပိုင်း
* **🛍️ E-Commerce & Online Shop**:
  * အမျိုးအစားအလိုက် ကုန်ပစ္စည်းများ ကြည့်ရှုခြင်း (Category & Product Catalog with Photos & Prices).
  * ခြင်းတောင်းထဲထည့်ခြင်း (Add to Cart / Cart Management).
  * အော်ဒါတင်ခြင်း (Customer Name, Phone, Delivery Address, COD သို့မဟုတ် KBZPay/WavePay ငွေလွှဲပြေစာ ပုံတင်ခြင်း).
  * အော်ဒါအခြေအနေ ခြေရာခံခြင်း (`📦 My Orders`).
* **💬 Customer Service & Live Chat**:
  * မေးလေ့ရှိသော မေးခွန်းများ အလိုအလျောက် ဖြေကြားခြင်း (FAQ Knowledge Base).
  * Admin နှင့် တိုက်ရိုက် စကားပြောခြင်း (`/support`) -> User ပို့သမျှ စာများသည် Admin Dashboard သို့ တိုက်ရိုက်ရောက်ရှိပြီး Admin မှ Dashboard ပေါ်မှ စာရိုက်၍ တိုက်ရိုက် ပြန်ကြားနိုင်ခြင်း။
* **📰 News & Info Feed**:
  * နောက်ဆုံးရ သတင်းများနှင့် ပရိုမိုးရှင်း ကြေညာချက်များ ဖတ်ရှုခြင်း (`/news`).
  * Admin မှ Bot သုံးစွဲသူအားလုံးထံသို့ ပုံ၊ စာသား၊ ခလုတ် (Buttons) ပါဝင်သော Broadcast မက်ဆေ့ခ်ျများ ချက်ချင်း ပေးပို့နိုင်ခြင်း။

---

### ၂။ Admin Web Dashboard အပိုင်း
* **📊 Analytics Overview**: စုစုပေါင်း Users၊ Orders၊ ရရှိပြီး ဝင်ငွေ၊ Live Support မက်ဆေ့ခ်ျ အရေအတွက်နှင့် ၇ ရက်တာ အရောင်း Chart (Recharts)။
* **📦 Product & Category Manager**: ကုန်ပစ္စည်း အသစ်ထည့်ခြင်း၊ ဓာတ်ပုံ၊ စျေးနှုန်း၊ လက်ကျန် Stock နှင့် အမျိုးအစားများ စီမံခြင်း။
* **📑 Order Management**: အော်ဒါများ စစ်ဆေးခြင်း၊ ငွေလွှဲပြေစာ Slip ပုံ ကြည့်ရှုခြင်း၊ Order Status ပြောင်းလဲခြင်း (ပြောင်းလဲချိန်တွင် Telegram Customer ထံ အလိုအလျောက် အသိပေးစာ ပို့နိုင်သည်)။
* **💬 Live Support Inbox**: Telegram User များနှင့် အချိန်နှင့်တစ်ပြေးညီ ၂ ဖက် စကားပြောဆိုနိုင်သော Chat Panel။
* **📢 Broadcast Center**: Bot User အားလုံးထံသို့ တစ်ပြိုင်နက် Mass Message ပေးပို့ခြင်းနှင့် သတင်းဆောင်းပါးများ တင်ခြင်း။
* **👥 Bot Users Directory**: Bot အသုံးပြုသူများ စာရင်း၊ Telegram ID၊ Phone၊ Join Date နှင့် Block/Unblock စီမံခြင်း။
* **⚙️ Settings & FAQ Config**: Bot Token ထည့်သွင်းခြင်း/ချိတ်ဆက်ခြင်း၊ Bot Start/Stop ပြုလုပ်ခြင်း၊ KBZPay/WavePay အကောင့်များ သတ်မှတ်ခြင်းနှင့် FAQ မေးခွန်းများ စီမံခြင်း။

---

## 🚀 စတင် အသုံးပြုနည်း (Getting Started)

### ၁။ Folder သို့ သွားပါ
```bash
cd C:\Users\ST\.gemini\antigravity\scratch\telegram-omni-bot-dashboard
```

### ၂။ Backend & Frontend တစ်ပြိုင်နက် Run ရန်
```bash
python run_server.py
```

* **Admin Dashboard UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API Swagger**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🤖 Telegram Bot Token ချိတ်ဆက်နည်း

1. Telegram တွင် **@BotFather** ကို ဖွင့်ပါ။
2. `/newbot` ရိုက်ပို့ပြီး မိမိ Bot Name နှင့် Username သတ်မှတ်ပါ။
3. BotFather မှ ပေးသော **HTTP API Token** ကို ကူးယူပါ။
4. Admin Dashboard ၏ **"Settings -> Telegram Bot"** တွင် ထည့်ပြီး **"Save & Connect Bot"** ကို နှိပ်ပါ။
5. သင်၏ Bot ကို Telegram တွင် `/start` နှိပ်၍ စတင် အသုံးပြုနိုင်ပါပြီ! 🎉
