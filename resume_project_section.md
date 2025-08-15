# Resume Project Section

## SaaS Base – Automated Access Control with Recharge System
**Role:** Full-Stack Developer | **Duration:** [Add duration] | **Tech Stack:** Node.js, JWT, Razorpay, MSG91, AWS, MySQL

### Project Overview
Developed a fully automated hybrid prepaid + subscription SaaS platform for loan origination systems, eliminating manual intervention and reducing activation delays from hours to seconds.

### Key Achievements
• **Automated Payment Processing:** Integrated Razorpay webhooks with HMAC verification for instant account activation/deactivation
• **Real-time Access Control:** Built middleware system that validates wallet balance/subscription status before form submissions
• **Multi-tier Monetization:** Implemented pay-per-form model (₹5-50/form) with atomic wallet deductions and subscription management
• **Notification System:** Integrated MSG91 for automated SMS/WhatsApp alerts on low balance, expiry, and payment confirmations
• **Scalable Architecture:** Designed RBAC system supporting DSAs, NBFCs, and Co-op Banks with role-specific features

### Technical Implementation
• **Backend:** RESTful APIs with JWT authentication and role-based access control
• **Database:** Designed normalized schema for users, wallets, transactions, and applications
• **Payment Integration:** Razorpay checkout with webhook listeners for instant balance updates
• **Cloud Infrastructure:** Deployed on AWS EC2 with S3 for document storage
• **Automation:** Implemented cron schedulers for balance monitoring and automated notifications

### Business Impact
• Eliminated billing disputes through real-time usage tracking
• Reduced manual intervention to zero for account management
• Enabled instant service activation/deactivation based on payment status
• Built scalable foundation ready for credit bureau and fraud detection integrations

---

## Alternative Bullet Point Format (for limited space):

**SaaS Automated Access Control System** | Full-Stack Developer
• Built automated prepaid/subscription SaaS platform eliminating manual account management
• Integrated Razorpay payments with webhook verification for instant activation/deactivation  
• Developed real-time access middleware validating wallet balance before form submissions
• Implemented MSG91 notifications for automated alerts and OTP authentication
• Designed RBAC system supporting multiple user types (DSAs, NBFCs, Co-op Banks)
• Deployed on AWS (EC2, S3) with JWT authentication and atomic transaction processing