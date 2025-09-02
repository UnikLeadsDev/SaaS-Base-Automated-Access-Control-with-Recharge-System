# Internationalization (i18n) Integration Guide

## Quick Start

### 1. Import Translation Function
```javascript
import { t } from '../utils/i18n';
```

### 2. Replace Hardcoded Text
```javascript
// Before
<h1>Dashboard</h1>

// After  
<h1>{t('nav.dashboard')}</h1>
```

### 3. Use Parameters
```javascript
// Before
<p>Welcome, {user.name}</p>

// After
<p>{t('dashboard.welcome', {name: user.name})}</p>
```

## Available Translation Keys

### Navigation
- `nav.dashboard`, `nav.wallet`, `nav.forms`, `nav.support`, `nav.logout`

### Dashboard
- `dashboard.welcome`, `dashboard.applications`, `dashboard.access_type`
- `dashboard.form_access`, `dashboard.recent_transactions`, `dashboard.no_transactions`
- `dashboard.available`, `dashboard.blocked`, `dashboard.active`

### Wallet
- `wallet.balance`, `wallet.recharge`, `wallet.history`, `wallet.insufficient`

### Forms
- `form.basic`, `form.realtime`, `form.submit`
- `form.applicant.name`, `form.loan.amount`, `form.purpose`

### Common
- `common.loading`, `common.submit`, `common.cancel`, `common.save`
- `common.edit`, `common.delete`, `common.search`, `common.filter`, `common.export`

## Adding New Keys

1. **Add to both languages** in `utils/i18n.js`:
```javascript
en: {
  'your.new.key': 'English Text'
},
hi: {
  'your.new.key': 'हिंदी पाठ'
}
```

2. **Use in components**:
```javascript
{t('your.new.key')}
```

## Language Switching

```javascript
import { i18n } from '../utils/i18n';

// Switch language
i18n.setLanguage('hi'); // or 'en'

// Get current language
const currentLang = i18n.getCurrentLanguage();
```

## Best Practices

- Use descriptive key names: `dashboard.welcome` not `welcome`
- Group related keys: `form.submit`, `form.cancel`
- Always provide both English and Hindi translations
- Use parameters for dynamic content: `{name}`, `{amount}`