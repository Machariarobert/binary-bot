# 🔄 Binary Bot - Landing Page Redirect Analysis

## 🎯 Quick Answer

**The page redirects to the landing page when:**

1. **No Banner Token** - When `setDueDateForBanner` is NOT in localStorage
2. **Expired Token** - When the banner token timestamp has passed
3. **Timer Expires** - After 7 days (or 2 minutes in some flows) of bot usage
4. **EU/UK Location** - Certain geographic redirects to Deriv
5. **Language Change** - When changing language on landing page

---

## 🔍 The Three Redirect Mechanisms

### 1. **Banner Token System** (Primary Redirect)

#### What is the Banner Token?
Located in `localStorage['setDueDateForBanner']` - a timestamp that grants temporary access to the bot interface.

```javascript
// Token expires after 7 days
const sevenDays = 7;
const oneDay = 24 * 60 * 60 * 1000;
const expirationDate = today + oneDay * sevenDays;
```

#### How It Works:

**Token Missing (null/undefined):**
```javascript
// In renderReactComponents() - src/botPage/view/View.js:856
if (bannerToken === null || bannerToken === undefined) {
    const getDefaultPath = window.location.href.replace(/\/bot(\.html)?/, serialize(qs));
    window.location.replace(getDefaultPath);  // REDIRECT TO LANDING
    document.getElementById('errorArea').remove();
    $('.barspinner').hide();
}
```
**Result:** Immediately redirects from `/bot.html` to `/index.html`

**Token Expired:**
```javascript
// In renderReactComponents() - src/botPage/view/View.js:849
if (new Date().getTime() > Number(bannerToken)) {
    remove('setDueDateForBanner');  // Clear expired token
    const getDefaultPath = window.location.href.replace(/\/bot(\.html)?/, serialize(qs));
    window.location.replace(getDefaultPath);  // REDIRECT TO LANDING
    return false;
}
```
**Result:** If current time exceeds token timestamp, redirect to landing

**Token Valid:**
```javascript
else {
    setTimeOutBanner('views');  // Set 7-day timer
    render(<ServerTime api={api} />, $('#server-time')[0]);
    render(<Tour />, $('#tour')[0]);
    // ... render other components
    document.getElementById('bot-main').classList.remove('hidden');
    document.getElementById('toolbox').classList.remove('hidden');
    $('.barspinner').hide();
}
```
**Result:** Shows bot interface, starts countdown timer

---

### 2. **Timeout Timer** (Secondary Redirect)

#### The 7-Day Countdown
Located in `src/indexPage/index.js`:

```javascript
export const setTimeOutBanner = route => {
    let bannerDisplayed;
    const qs = parseQueryString();
    
    timerForBanner = setTimeout(() => {
        if (
            (route === 'index' && !!bannerDisplayed === false) ||
            (route === 'views' && checkifBotRunning() === false)  // Bot NOT running
        ) {
            const getDefaultPath = window.location.href.replace(/\/bot(\.html)?/, serialize(qs));
            window.location.replace(getDefaultPath);  // REDIRECT TO LANDING
            renderBanner();
        } else if (
            (route === 'index' && !!bannerDisplayed === true) ||
            (route === 'views' && checkifBotRunning() === true)  // Bot IS running
        ) {
            remove('setDueDateForBanner');  // Cancel redirect if bot running
            return false;
        }
    }, calcSetTimeoutValueBanner);  // 7 days in milliseconds
};

// Timer calculation
export const calcSetTimeoutValueBanner = expirationDate() - new Date().getTime();
```

**How It Triggers:**

1. **Called on bot page load:** `setTimeOutBanner('views')`
2. **Waits for timer:** Default 7 days (`calcSetTimeoutValueBanner`)
3. **Checks bot status:** Is the bot actively running trades?
4. **Redirects if idle:** If bot is NOT running, redirect to landing
5. **Cancels if active:** If bot IS running, remove token and prevent redirect

**Bot Running Check:**
```javascript
const checkifBotRunning = () => {
    if (document.getElementById('runButton').style.display === 'none') {
        return true;  // Run button hidden = bot is running
    }
    return false;  // Run button visible = bot is idle
};
```

---

### 3. **Geographic Redirect** (Deriv Migration)

#### EU/UK Auto-Redirect
Located in `src/common/utils/utility.js`:

```javascript
export const moveToDeriv = async () => {
    const clients_country = await getClientsCountryByIP();
    const tokenList = getTokenList();
    const landingCompanyName = tokenList.map(token => token.loginInfo.landing_company_name);

    // No tokens + EU/UK country = redirect
    if (!tokenList.length) {
        if (isEuCountry(clients_country) || isUKCountry(clients_country)) {
            window.location.replace('https://binary.com/move-to-deriv');  // REDIRECT
        }
    }

    // Specific account types = redirect
    if (
        (landingCompanyName.length === 1 &&
            landingCompanyName.includes('virtual') &&
            (isEuCountry(clients_country) ||
                isUKCountry(clients_country) ||
                isEuCountry(localStorage.getItem('residence')) ||
                isUKCountry(localStorage.getItem('residence')))) ||
        landingCompanyName.includes('maltainvest') ||
        landingCompanyName.includes('malta') ||
        landingCompanyName.includes('iom')
    ) {
        window.location.replace('https://binary.com/move-to-deriv');  // REDIRECT
    }
};
```

**EU Countries List:**
```javascript
const euCountries = [
    'it', 'de', 'fr', 'lu', 'gr', 'es', 'sk', 'lt', 'nl', 'at',
    'bg', 'si', 'cy', 'be', 'ro', 'hr', 'pt', 'pl', 'lv', 'ee',
    'cz', 'fi', 'hu', 'dk', 'se', 'ie', 'gb', 'mt'
];
```

**When It Triggers:**
- **loginCheck()** calls `moveToDeriv()` on page load
- Checks user's IP-based country
- Checks account landing company (maltainvest, malta, iom)
- Redirects to `https://binary.com/move-to-deriv`

---

### 4. **Language Change Redirect**

Located in `src/common/lang.js`:

```javascript
$('#select_language li:not(:first)').click(function click() {
    const newLang = $(this).attr('class');
    if (
        document.getElementById('bot-landing') !== null &&
        document.getElementById('bot-landing') !== undefined &&
        document.getElementById('bot-landing').classList.contains('hidden') === false
    ) {
        remove('setDueDateForBanner');  // Clear token
        render(<BotLanding />, document.getElementById('bot-landing'));
        elements.map(elem => document.querySelector(elem).classList.add('hidden'));
        document.getElementById('bot-landing').classList.remove('hidden');
        document.getElementById('bot-main').classList.add('hidden');
        document.location.search = `l=${newLang}`;  // REDIRECT with lang param
        $('.barspinner').hide();
    } else {
        document.location.search = `l=${newLang}`;  // REDIRECT
    }
});
```

**Result:** Changing language clears token and shows landing page

---

## 🎫 How to GET a Banner Token

### User Action Required
The token is ONLY set when the user clicks a button on the landing page:

**Location:** `src/indexPage/react-components/bot-landing/ModalComponent.jsx`

```javascript
const setDueDateAgain = () => {
    remove('setDueDateForBanner');
    remove('setPopupToken');
    setStorage('setDueDateForBanner', new Date().getTime() + 1000 * 120);  // 2 minutes
    setStorage('setPopupToken', new Date().getTime() + 1000 * 60);         // 1 minute
    renderPopup('close');
    clearTimeout(timerForBanner);
    setTimeOutBanner();
    setTimeOutPopup();
}
```

**Triggered By:**
```jsx
<div className='bot-landing-alert-header'>
    <img src="image/close_icon.svg" alt="close popup" onClick={setDueDateAgain} />
</div>
```

**Token Lifespan:** 2 minutes (120 seconds) from click

**Flow:**
1. User lands on landing page (`index.html`)
2. Modal popup appears
3. User clicks close icon (X)
4. `setDueDateAgain()` runs
5. Token saved: `localStorage['setDueDateForBanner'] = timestamp + 120000`
6. User can now access bot for 2 minutes
7. After 2 minutes, next visit redirects back to landing

---

## 🔄 Complete Redirect Flow Diagram

```
User Visits bot.html
        │
        ▼
Check: bannerToken exists?
        │
        ├─── NO ──────────────────────────────────┐
        │                                          │
        ▼                                          │
Check: bannerToken expired?                       │
        │                                          │
        ├─── YES ─────────────────────────────────┤
        │                                          │
        ▼                                          │
Check: EU/UK country?                              │
        │                                          │
        ├─── YES ─────> Redirect to Deriv ────────┤
        │                                          │
        ▼                                          │
Check: Correct account type?                       │
        │                                          │
        ├─── NO (maltainvest/malta/iom) ─────────┤
        │                                          │
        ▼                                          │
  SHOW BOT INTERFACE                               │
        │                                          │
        ▼                                          │
  Start 7-day timer                                │
        │                                          │
        ▼                                          │
  Timer expires                                    │
        │                                          │
        ▼                                          │
  Check: Bot running?                              │
        │                                          │
        ├─── NO ──────────────────────────────────┤
        │                                          │
        ▼                                          ▼
   REDIRECT TO LANDING PAGE ◄───────────────── index.html
        │
        ▼
   Show modal popup
        │
        ▼
   User clicks X
        │
        ▼
   Set token (2 minutes)
        │
        ▼
   Can access bot.html again
```

---

## 🛑 All Redirect Locations in Code

### Primary Redirects (Landing Page)

1. **View.js:852** - Token expired
   ```javascript
   window.location.replace(getDefaultPath);
   ```

2. **View.js:857** - Token missing
   ```javascript
   window.location.replace(getDefaultPath);
   ```

3. **index.js:70** - Timer expired (7-day countdown)
   ```javascript
   window.location.replace(getDefaultPath);
   ```

### Secondary Redirects (Deriv Migration)

4. **utility.js:47** - No tokens + EU/UK
   ```javascript
   window.location.replace('https://binary.com/move-to-deriv');
   ```

5. **utility.js:62** - Specific account types
   ```javascript
   window.location.replace('https://binary.com/move-to-deriv');
   ```

### Other Redirects

6. **blockly/index.js:240** - DBot strategy detected
   ```javascript
   window.location.href = 'https://app.deriv.com/bot';
   ```

7. **ModalComponent.jsx:19** - Show landing banner
   ```javascript
   window.location.replace(getDefaultPath);
   ```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Bot keeps redirecting to landing page"
**Cause:** No banner token or expired token

**Check:**
```javascript
// In browser console
localStorage.getItem('setDueDateForBanner');
// null or timestamp in the past = will redirect
```

**Solution:**
1. Go to landing page (index.html)
2. Wait for modal popup
3. Click the X button
4. Token will be set for 2 minutes
5. Navigate to bot.html within 2 minutes

### Issue 2: "Can't stay on bot page for more than 2 minutes"
**Cause:** Token has short lifespan (120 seconds)

**Explanation:**
```javascript
setStorage('setDueDateForBanner', new Date().getTime() + 1000 * 120);  // Only 120 seconds!
```

**Why?**
- Original design: 7-day token
- Current implementation: 2-minute token
- Intentional limitation to show landing page/migration message

### Issue 3: "Redirect happens after 7 days"
**Cause:** `setTimeOutBanner()` timer expires

**Prevention:**
- Keep bot actively running trades
- Bot checks if run button is hidden
- Active bot prevents redirect

### Issue 4: "EU users can't access bot at all"
**Cause:** Geographic redirect to Deriv

**Countries Affected:** All EU + UK (28 countries)

**Accounts Affected:**
- Virtual accounts from EU/UK
- Maltainvest accounts
- Malta accounts  
- Isle of Man accounts

**Solution:** Use Deriv Bot instead (https://app.deriv.com/bot)

---

## 🔧 Recent Fix Implementation

### The Conditional Execution Fix
Located in `src/indexPage/index.js`:

```javascript
// Only run loginCheck on non-bot pages (index.html, movetoderiv.html)
if (window.location.pathname.indexOf('/bot') === -1) {
    loginCheck();
}
```

**What This Fixed:**
- Previously: `loginCheck()` ran on ALL pages (including bot.html)
- Problem: Module-level code executed on import
- Bot page imports: `import { setTimeOutBanner, getComponent } from '../../indexPage'`
- Result: Redirect logic ran even on bot.html

**Why It Works:**
- Wraps auto-execution in URL check
- `/bot.html` paths skip `loginCheck()` entirely
- Landing pages (`/index.html`, `/movetoderiv.html`) still run `loginCheck()`
- Functions remain exportable for bot page to use

**Before:**
```javascript
loginCheck();  // Runs on EVERY page
```

**After:**
```javascript
if (window.location.pathname.indexOf('/bot') === -1) {
    loginCheck();  // Runs only on landing pages
}
```

---

## 🎯 Summary

### What Causes Redirects:

| Trigger | Location | Condition | Destination |
|---------|----------|-----------|-------------|
| **No Token** | View.js:857 | `bannerToken === null/undefined` | Landing page |
| **Expired Token** | View.js:852 | `time > bannerToken` | Landing page |
| **7-Day Timer** | index.js:70 | Timer expires + bot idle | Landing page |
| **EU/UK Location** | utility.js:47,62 | IP in EU/UK + certain accounts | Deriv migration |
| **Language Change** | lang.js:44 | User changes language | Landing page |
| **DBot Strategy** | blockly/index.js:240 | Strategy has `is_dbot` attribute | Deriv Bot |

### How to Avoid Redirects:

1. ✅ **Get a token:** Click X on landing page modal
2. ✅ **Stay active:** Keep bot running trades (prevents 7-day timer)
3. ✅ **Right location:** Use from non-EU/UK country
4. ✅ **Right account:** Avoid maltainvest/malta/iom accounts
5. ✅ **Don't change language:** Clears token

### Token Lifecycle:

```
Landing Page Visit
       ↓
Modal Appears
       ↓
User Clicks X
       ↓
Token Set (2 minutes)
       ↓
Can Access Bot
       ↓
2 Minutes Pass
       ↓
Token Expires
       ↓
Next Visit → Landing Page
```

---

## 💡 Key Takeaway

The redirect system is **intentional** - it's designed to:
1. Show users the landing/marketing page regularly
2. Encourage migration to Deriv for EU/UK users
3. Present benefits of the new Deriv platform
4. Control access to the legacy bot interface

The 2-minute token (not 7-day) suggests this is a temporary access system, not meant for long-term bot usage without seeing the landing page.
