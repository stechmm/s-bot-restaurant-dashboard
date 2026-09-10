# 🌐 SPanel VPS ပေါ်သို့ sbot.stechmm.app တင်နည်း လမ်းညွှန်

ဤလမ်းညွှန်ချက်သည် **S-Bot Multi-Business & Restaurant Control Center** ကို **SPanel VPS** ပေါ်တွင် Domain: **`sbot.stechmm.app`** ဖြင့် ၂၄ နာရီ မရပ်မနား Run နိုင်အောင် အဆင့်ဆင့် ပြုလုပ်နည်း ဖြစ်ပါသည်။

---

## အဆင့် (၁) — DNS A Record ချိတ်ဆက်ခြင်း

မိမိ Domain စီမံခန့်ခွဲရာနေရာ (Cloudflare သို့မဟုတ် Domain Registrar) တွင် DNS Record ထည့်သွင်းပါ-
* **Type**: `A`
* **Name (Host)**: `sbot` (သို့မဟုတ် `sbot.stechmm.app`)
* **Target / IP**: သင်၏ `SPanel VPS IP Address`
* **Proxy Status**: DNS Only (သို့မဟုတ် Cloudflare Proxy ON)

---

## အဆင့် (၂) — SPanel ထဲတွင် Website / Subdomain ဖန်တီးခြင်း

1. **SPanel Admin / User Panel** သို့ ဝင်ရောက်ပါ။
2. **Domains / Websites** သို့ သွားပြီး **Create a new account / domain** ကို နှိပ်ပါ။
3. Domain အမည်တွင် **`sbot.stechmm.app`** ဟု ထည့်သွင်းပြီး ဖန်တီးပါ။
4. **SSL Certificates** ကဏ္ဍသို့ သွားပြီး `sbot.stechmm.app` အတွက် **Let's Encrypt (Free SSL)** ကို 1-Click ဖြင့် အသက်သွင်း (Install) လုပ်ပါ။

---

## အဆင့် (၃) — VPS ပေါ်တွင် S-Bot ကို Run ခြင်း (All-in-One Docker — အလွယ်ဆုံးနည်း)

SPanel ၏ **SSH Terminal** (သို့မဟုတ် PuTTY) မှတစ်ဆင့် အောက်ပါ command ၃ ကြောင်းသာ ရိုက်ထည့်ပါ-

```bash
# ၁။ GitHub မှ project ကို ဆွဲယူပါ
git clone https://github.com/stechmm/s-bot-restaurant-dashboard.git

# ၂။ Folder ထဲ ဝင်ပါ
cd s-bot-restaurant-dashboard

# ၃။ All-in-One script ကို run ပါ (Docker မရှိသေးပါက အလိုအလျောက် သွင်းပြီး စတင် run ပေးပါမည်)
bash setup.sh
```

*(ဤ command ပြီးသည်နှင့် S-Bot သည် Server ၏ Port `8000` ပေါ်တွင် အသင့် စတင် လည်ပတ်နေပါပြီ)*

---

## အဆင့် (၄) — SPanel Nginx Reverse Proxy ချိန်ညှိခြင်း

`sbot.stechmm.app` သို့ လာသမျှ Request များကို Port 8000 ရှိ S-Bot ထံ လွှဲပြောင်းပေးရန်-

1. SPanel ထဲရှိ **`sbot.stechmm.app`** ၏ **Nginx Configuration / Reverse Proxy** (သို့မဟုတ် OpenLiteSpeed Proxy) သို့ သွားပါ။
2. အောက်ပါ Code ကို ကူးယူထည့်သွင်းပါ (သို့မဟုတ် `nginx_sbot.conf` ထဲရှိ စာသားများကို ကူးယူပါ)-

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    proxy_buffering off;
    proxy_cache off;
}
```
3. **Save** နှိပ်ပါ။

---

## အဆင့် (၅) — ပြီးစီးခြင်းနှင့် စတင် အသုံးပြုခြင်း 🎉

Browser မှနေ၍ အောက်ပါ Link ကို ဖွင့်ပါ-

👉 **https://sbot.stechmm.app**

* **Username**: `admin`
* **Password**: `admin123`

Dashboard သို့ ဝင်ရောက်ပြီး **Stores & Bots Hub** တွင် မိမိ Bot များကို ၂၄ နာရီ စတင် အသုံးပြုနိုင်ပါပြီ!
