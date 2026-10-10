# WorldBuyBD — GitHub ও Firebase ডোমেইন (worldbuybd.web.app) পাবলিশিং গাইড

এই ডকুমেন্টে বিস্তারিতভাবে দেখানো হয়েছে কিভাবে আপনি GitHub ব্যবহার করে আপনার ওয়েবসাইটটি **`http://worldbuybd.web.app`** এবং আপনার নিজস্ব কাস্টম ডোমেইনে (যেমন: `worldbuybd.com`) সরাসরি লাইভ পাবলিশ করবেন।

---

## সূচিপত্র
1. [ধাপ ১: Firebase Hosting-এ `worldbuybd` সাইট সক্রিয় করা](#ধাপ-১-firebase-hosting-এ-worldbuybd-সাইট-সক্রিয়-করা)
2. [ধাপ ২: GitHub-এ প্রজেক্ট আপলোড করা (Git Push)](#ধাপ-২-github-এ-প্রজেক্ট-আপলোড-করা-git-push)
3. [ধাপ ৩: GitHub Actions দিয়ে অটোমেটিক ডিপ্লয় (CI/CD) সেটাপ](#ধাপ-৩-github-actions-দিয়ে-অটোমেটিক-ডিপ্লয়-cicd-সেটাপ)
4. [ধাপ ৪: টার্মিনাল থেকে সরাসরি ডিপ্লয় করার সহজ পদ্ধতি](#ধাপ-৪-টার্মিনাল-থেকে-সরাসরি-ডিপ্লয়-করার-সহজ-পদ্ধতি)
5. [ধাপ ৫: নিজস্ব কাস্টম ডোমেন (যেমন: worldbuybd.com) যুক্ত করার নিয়ম](#ধাপ-৫-নিজস্ব-কাস্টম-ডোমেন-যেমন-worldbuybdcom-যুক্ত-করার-নিয়ম)

---

## ধাপ ১: Firebase Hosting-এ `worldbuybd` সাইট সক্রিয় করা

আপনার Firebase প্রোজেক্টের নাম: `awesome-almanac-1vxch`

`worldbuybd.web.app` ডোমেনটি চালু করতে:
1. [Firebase Console](https://console.firebase.google.com/) এ লগইন করুন।
2. আপনার প্রোজেক্টটিতে ঢুকুন (`awesome-almanac-1vxch`)।
3. বামপাশের মেনু থেকে **Build** > **Hosting**-এ ক্লিক করুন।
4. হোস্টিং ড্যাশবোর্ডের নিচের দিকে **"Add another site"** (আরেকটি সাইট যোগ করুন) বাটনে ক্লিক করুন।
5. সাইটের নাম বা Site ID হিসেবে লিখুন: `worldbuybd`
6. সেভ করুন। সাথে সাথে আপনার জন্য দুটি ফ্রি ডোমেন তৈরি হয়ে যাবে:
   - **`https://worldbuybd.web.app`**
   - **`https://worldbuybd.firebaseapp.com`**

*(নোট: আমাদের প্রোজেক্টের `firebase.json` ফাইলে ইতিমধ্যে `"site": "worldbuybd"` কনফিগার করা রয়েছে)*

---

## ধাপ ২: GitHub-এ প্রজেক্ট আপলোড করা (Git Push)

আপনার কম্পিউটারে টার্মিনাল (Terminal বা Command Prompt) ওপেন করে প্রজেক্ট ফোল্ডারে যান এবং নিচের কমান্ডগুলো রান করুন:

```bash
# ১. গিট ইনিশিয়ালাইজ করুন (যদি আগে না করা থাকে)
git init

# ২. মেইন ব্রাঞ্চ নির্বাচন করুন
git branch -M main

# ৩. সমস্ত ফাইল যুক্ত করুন
git add .

# ৪. প্রথম কমিট তৈরি করুন
git commit -m "feat: complete WorldBuyBD ecommerce store with Firebase hosting setup"

# ৫. আপনার GitHub রিপোজিটরির লিংক যুক্ত করুন (আপনার GitHub রিপো URL দিন)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/worldbuybd.git

# ৬. গিটহাবে পুশ করুন
git push -u origin main
```

---

## ধাপ ৩: GitHub Actions দিয়ে অটোমেটিক ডিপ্লয় (CI/CD) সেটাপ

আমরা আপনার প্রোজেক্টে `.github/workflows/firebase-hosting-deploy.yml` ফাইল তৈরি করে দিয়েছি। এখন গিটহাবে প্রতিবার কোড পুশ করলেই এটি স্বয়ংক্রিয়ভাবে বিল্ড হয়ে `worldbuybd.web.app`-এ লাইভ হয়ে যাবে।

### GitHub-এ সিক্রেট যোগ করার সহজ নিয়ম:
1. আপনার কম্পিউটারের টার্মিনালে রান করুন:
   ```bash
   npx firebase-tools login:ci
   ```
   এটি ব্রাউজারে একটি গুগল লগইন পেজ খুলবে। লগইন করলে টার্মিনালে একটি বড় **Token** পাবেন।
2. আপনার GitHub রিপোজিটরিতে যান > **Settings** > **Secrets and variables** > **Actions**-এ যান।
3. **New repository secret** বাটনে ক্লিক করুন:
   - **Name:** `FIREBASE_TOKEN`
   - **Secret:** টার্মিনাল থেকে পাওয়া টোকেনটি পেস্ট করুন।
4. এখন GitHub-এ যেকোনো কোড পুশ করলেই **GitHub Actions** স্বয়ংক্রিয়ভাবে ওয়েবসাইটটি `https://worldbuybd.web.app`-এ লাইভ করে দেবে!

*(বিকল্প পদ্ধতি: টার্মিনালে `npx firebase-tools init hosting:github` রান করলে ফায়ারবেস নিজেই সার্ভিস অ্যাকাউন্ট কি গিটহাবে যুক্ত করে দেয়)*

---

## ধাপ ৪: টার্মিনাল থেকে সরাসরি ডিপ্লয় করার সহজ পদ্ধতি

আপনি যদি গিটহাব ছাড়া আপনার কম্পিউটার থেকে মাত্র ৩০ সেকেন্ডে সাইটটি সরাসরি লাইভ পাবলিশ করতে চান:

```bash
# ১. প্রোডাকশন বিল্ড তৈরি করুন
npm run build

# ২. ফায়ারবেসে লগইন করুন (যদি লগইন করা না থাকে)
npx firebase-tools login

# ৩. সরাসরি পাবলিশ করুন
npx firebase-tools deploy --only hosting
```

ডিপ্লয় শেষ হলে টার্মিনালে দেখতে পাবেন:
`✔ Deploy complete!`
`Hosting URL: https://worldbuybd.web.app`

---

## ধাপ ৫: নিজস্ব কাস্টম ডোমেন (যেমন: worldbuybd.com) যুক্ত করার নিয়ম

যদি আপনি পরবর্তীতে আপনার নিজস্ব কেনা ডোমেইন (যেমন `worldbuybd.com` বা `shop.worldbuybd.com`) এই সাইটের সাথে যুক্ত করতে চান:

1. [Firebase Console](https://console.firebase.google.com/) > **Hosting**-এ যান।
2. `worldbuybd` সাইটের পাশে থাকা **"Add custom domain"** বাটনে ক্লিক করুন।
3. আপনার ডোমেইন নাম দিন (যেমন: `worldbuybd.com`)।
4. Firebase আপনাকে ২টি **A Record** (IP Address) এবং ১টি **TXT Record** ভেরিফিকেশনের জন্য দেবে।
5. আপনার ডোমেইন প্রোভাইডারে (Namecheap, GoDaddy, Hostinger বা Cloudflare) এর DNS Management পেজে গিয়ে এই রেকর্ডগুলো যুক্ত করে দিন।
6. ২৪ ঘণ্টার মধ্যে (সাধারণত ৩০ মিনিটে) আপনার নিজস্ব ডোমেইন চালু হবে এবং গুগল কর্তৃক ফ্রি **SSL (HTTPS)** স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে!
