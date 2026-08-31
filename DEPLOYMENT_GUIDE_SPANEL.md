# 🌐 SPanel VPS ပေါ်သို့ S-Bot တင်နည်း လမ်းညွှန် (SPanel Deployment Guide)

ဒီလမ်းညွှန်ချက်သည် **S-Bot Restaurant & Admin Dashboard** ကို **SPanel VPS** ပေါ်သို့ ၂၄ နာရီ မရပ်မနား Run နိုင်အောင် အဆင့်ဆင့် တင်နည်းဖြစ်ပါသည်။

---

## ၁။ Project ဖိုင်များကို Zip ပြုလုပ်ပြီး VPS ပေါ်တင်ခြင်း

1. မိမိကွန်ပျူတာရှိ `telegram-omni-bot-dashboard` folder အားလုံး (သို့မဟုတ် `backend/` နှင့် `frontend/dist/`) ကို **`sbot.zip`** အဖြစ် Zip ဖိုင် ချုံ့ပါ။
2. **SPanel Control Panel** သို့ ဝင်ရောက်ပါ။
3. **File Manager** သို့ သွားပြီး မိမိ Domain သို့မဟုတ် User directory (ဥပမာ- `/home/username/sbot`) တွင် `sbot.zip` ကို **Upload** တင်ပြီး **Extract (Unzip)** လုပ်ပါ။

---

## ၂။ SSH Terminal ဖွင့်၍ Dependencies သွင်းခြင်း

SPanel ၏ **SSH Terminal** (သို့မဟုတ် PuTTY) မှတစ်ဆင့် အောက်ပါ command များကို ရိုက်ထည့်ပါ-

```bash
# ၁။ Folder ထဲသို့ ဝင်ပါ
cd /home/username/sbot

# ၂။ Python Virtual Environment ဆောက်ပါ
python3 -m venv venv
source venv/bin/activate

# ၃။ လိုအပ်သော Packages များ သွင်းပါ
pip install -r backend/requirements.txt

# ၄။ Restaurant Data အသင့် စတင်ထည့်သွင်းပါ
cd backend
python seed_data.py
cd ..
```

---

## ၃။ S-Bot ကို ၂၄ နာရီ အမြဲတမ်း Run ထားရန် (Background Service)

ရွေးချယ်စရာ နည်းလမ်း ၂ မျိုး ရှိပါသည်-

### နည်းလမ်း (A): PM2 ဖြင့် Run ခြင်း (အလွယ်ဆုံး)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### နည်းလမ်း (B): Systemd Service ဖြင့် Run ခြင်း
```bash
sudo cp sbot.service /etc/systemd/system/sbot.service
# (မှတ်ချက်: sbot.service ထဲရှိ YOUR_SPANEL_USER နေရာတွင် မိမိ user အမည် ပြောင်းပါ)
sudo systemctl daemon-reload
sudo systemctl enable sbot
sudo systemctl start sbot
```

---

## ၄။ Domain နှင့် Reverse Proxy (Nginx) ချိတ်ဆက်ခြင်း

SPanel တွင် Domain သို့မဟုတ် Subdomain (ဥပမာ- `bot.yourdomain.com`) ၏ **Nginx Configuration / Reverse Proxy** တွင် အောက်ပါအတိုင်း ထည့်ပါ-

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
}
```

* **Free SSL (Let's Encrypt)** ကို SPanel ထဲမှ တစ်ချက်နှိပ် (1-Click) ဖြင့် Enable လုပ်လိုက်ပါ။

---

## ၅။ စတင် အသုံးပြုခြင်း

* Browser မှ မိမိ၏ Domain ကို ဖွင့်ပါ: `https://bot.yourdomain.com`
* Dashboard ရှိ **Settings -> Telegram Bot** တွင် Bot Token ကို ထည့်သွင်းပြီး **Save & Connect** နှိပ်သည်နှင့် Bot သည် Online ပေါ်တွင် ၂၄ နာရီ မနားတမ်း စတင် လည်ပတ်နေပါမည်! 🎉
