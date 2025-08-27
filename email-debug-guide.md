# Email Verification Troubleshooting Guide

## Common Reasons You're Not Receiving Verification Emails

### 1. **Check Spam/Junk Folder**
- Gmail: Check "Spam" folder
- Outlook: Check "Junk Email" folder
- Apple Mail: Check "Junk" folder
- Search for emails from "noreply@held-62986.firebaseapp.com" or "Firebase"

### 2. **Firebase Auth Domain Configuration**
The Firebase project needs to have authorized domains configured:

**To check:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (held-62986)
3. Go to Authentication > Settings > Authorized domains
4. Make sure these domains are added:
   - `localhost` (for development)
   - `held-62986.firebaseapp.com`
   - Your production domain

### 3. **Email Provider Blocking**
Some email providers (especially corporate ones) block automated emails:
- Try with a personal Gmail/Yahoo/iCloud account
- Check with your IT department if using corporate email

### 4. **Firebase Project Settings**
Check Firebase Auth email templates:
1. Firebase Console > Authentication > Templates
2. Email address verification should be enabled
3. Check the "From" email address and reply-to settings

### 5. **Development Environment**
In development mode, some email services may be limited:
- Try creating an account with a different email
- Check browser console for any errors during signup

## Quick Test

Open browser console on the signup page and run:
```javascript
// Test if Firebase Auth is properly configured
console.log('Auth domain:', firebase.auth().app.options.authDomain);
console.log('Project ID:', firebase.auth().app.options.projectId);
```

## Manual Email Resend

If you've already created an account, you can manually resend the verification:
1. Go to the signup page
2. Use the same email/password to "create" the account again
3. Firebase will show an error but the email might resend
4. Or use the "Resend Verification Email" button that appears after signup

## Alternative: Skip Email Verification Temporarily

For testing, you can temporarily disable email verification by commenting out this line in the signup code:
```typescript
// await sendEmailVerification(user);
```

But re-enable it for production!

## Check Firebase Logs

1. Go to Firebase Console > Functions > Logs
2. Look for any email-related errors
3. Check Authentication > Users to see if the account was created

## Production Checklist

- [ ] Authorized domains configured
- [ ] Email templates enabled
- [ ] SMTP settings configured (if custom)
- [ ] Domain verification completed
- [ ] DNS records properly set (if custom domain)

If none of these work, the issue might be with Firebase's email service itself, which occasionally has outages.
