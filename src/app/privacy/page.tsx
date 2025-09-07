'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="held-container held-container-wide py-12 md:py-16">
        <div className="mx-auto max-w-5xl space-y-8">

        <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-sm text-gray-500">Last updated: 2025-09-06</p>
        <p className="text-gray-700 leading-loose text-lg">Thank you for using <strong>myHeld.link</strong>. Privacy is important to us. This policy explains how we collect, use, and protect your information when you use our website and services.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">1. Information We Collect</h2>
        
        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mt-4">1.1 Information You Provide</h3>
        <p className="text-gray-700 leading-loose"><strong>Account Information:</strong> If you sign up, we collect your email address and any information you provide (such as your name or profile details).</p>
        <p className="text-gray-700 leading-loose"><strong>Content:</strong> Anything you add to the site, such as entries, notes, or uploaded images.</p>
        
        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mt-4">1.2 Information We Collect Automatically</h3>
        <p className="text-gray-700 leading-loose"><strong>Usage Data:</strong> We may collect information about how you use the site (e.g., which pages you visit, features you use).</p>
        <p className="text-gray-700 leading-loose"><strong>Cookies:</strong> We use essential cookies to keep you logged in and remember preferences. We may use simple analytics cookies, but we do <strong>not</strong> use advertising or tracking cookies.</p>
        
        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mt-4">1.3 Third-Party Authentication (Google, Apple)</h3>
        <p className="text-gray-700 leading-loose">You may choose to sign in using third-party accounts, such as Google or Apple.<br />
        When you do this, we receive basic information from your chosen provider—typically your name, email address, and profile picture.<br />
        We use this information only to create or manage your account. We do <strong>not</strong> access your contacts or post on your behalf.<br />
        You can control the information shared with us from your Google or Apple account settings.</p>
        
        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mt-4">1.4 Payments (Stripe)</h3>
        <p className="text-gray-700 leading-loose">If you choose to purchase a subscription or make a payment, we use Stripe, a trusted third-party payment processor.<br />
        We do <strong>not</strong> store or process your payment card details on our servers.<br />
        All payment information is handled securely by Stripe, in accordance with <a className="text-blue-700 underline hover:text-blue-900" href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe’s Privacy Policy</a>.</p>
        
        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mt-4">1.5 Analytics</h3>
        <p className="text-gray-700 leading-loose">We may use privacy-focused analytics tools (such as Plausible, Fathom, or Google Analytics) to understand usage. These tools may collect anonymized data (such as your browser type, device, or country).<br />
        No personal information is shared with advertisers.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">2. Where Your Data Is Stored</h2>
        <p className="text-gray-700 leading-loose">All user data is securely stored and managed using Google’s cloud infrastructure (such as Google Cloud and Firebase).<br />
        Google’s data centers may be located in various regions, but we rely on Google’s industry-leading security and privacy practices to protect your information.<br />
        You can learn more about Google’s privacy practices <a className="text-blue-700 underline hover:text-blue-900" href="https://policies.google.com/privacy" target="_blank" rel="noopener">here</a>.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">3. How We Use Your Information</h2>
        <p className="text-gray-700 leading-loose">We use your information to:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
          <li>Provide and maintain the service</li>
          <li>Personalize your experience</li>
          <li>Communicate with you (for example, password resets or important updates)</li>
          <li>Analyze usage to improve the site</li>
        </ul>
        <p className="text-gray-700 leading-loose">We <strong>do not</strong> sell, rent, or share your personal information with advertisers or third parties, except as required to operate the service or by law.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">4. How We Protect Your Information</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
          <li>Your data is stored securely using modern security practices.</li>
          <li>We use encryption for data in transit.</li>
          <li>Access to your personal data is limited to those who need it to operate the service.</li>
        </ul>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">5. Data Retention</h2>
        <p className="text-gray-700 leading-loose">We keep your data only as long as necessary for the purposes above.<br />
        You can request deletion of your account and all associated data at any time by contacting us.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">6. Your Rights</h2>
        <p className="text-gray-700 leading-loose">You have the right to:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
          <li>Access the personal information we hold about you</li>
          <li>Request correction or deletion of your information</li>
          <li>Withdraw consent or object to certain uses</li>
        </ul>
        <p className="text-gray-700 leading-loose">Contact us at <a className="text-blue-700 underline hover:text-blue-900" href="mailto:privacy@myheld.link">privacy@myheld.link</a> for requests.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">7. Children's Privacy</h2>
        <p className="text-gray-700 leading-loose">Our service is not intended for children under 13.<br />
        We do not knowingly collect personal information from children.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">8. Changes to This Policy</h2>
        <p className="text-gray-700 leading-loose">We may update this policy from time to time. If we make significant changes, we will notify you via the website or by email.</p>
        
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">9. Contact Us</h2>
        <p className="text-gray-700 leading-loose">Questions or requests? Email us at <a className="text-blue-700 underline hover:text-blue-900" href="mailto:privacy@myheld.link">privacy@myheld.link</a>.</p>

        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">10. Blockchain Data (Polygon Network)</h2>
        <p className="text-gray-700 leading-loose">Certain actions you take on myHeld.link may result in data being recorded (“anchored”) on the Polygon blockchain.</p>
        <p className="text-gray-700 leading-loose">
          This may include references to objects or items you post or claim ownership of. Information recorded on the blockchain is:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
          <li><strong>Public:</strong> Blockchain data is visible to anyone and may be accessible indefinitely.</li>
          <li><strong>Permanent:</strong> Once written to the blockchain, the information cannot be modified or deleted by us or anyone else.</li>
          <li><strong>Limited Data:</strong> We only anchor essential, non-personal references (such as unique object IDs or cryptographic proofs) unless otherwise stated. <strong>Do not include personal or sensitive information in content that will be recorded on the blockchain.</strong></li>
        </ul>
        <p className="text-gray-700 leading-loose">
          By using features that interact with the Polygon blockchain, you acknowledge and accept the public and permanent nature of blockchain records. If you have questions about what is stored, please contact us.
        </p>

<h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">11. No Warranty and Limitation of Liability</h2>
<p>
  We provide this service “as is” and make no guarantees about its accuracy, reliability, availability, or suitability for your particular purpose.
  To the fullest extent permitted by law, we disclaim all warranties and will not be liable for any damages arising from your use (or inability to use) the site, blockchain transactions, or third-party services.
</p>

<h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">12. Third-Party Services and Links</h2>
<p>
  Our service may link to or interact with third-party services (such as Google, Apple, Stripe, or the Polygon blockchain). We are not responsible for the privacy practices or content of these external sites or networks. Please review their privacy policies before using their services.
</p>

<h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5">13. Compliance and Jurisdiction</h2>
<p>
  This service is operated from [Your Country/Region, e.g., the United States]. By using this site, you consent to the processing and transfer of your information in accordance with this policy and applicable laws.
</p>

<h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 mt-5" >14. User Content Responsibility</h2>
<p>
  You are solely responsible for the content you post or anchor on myHeld.link, including content recorded on the blockchain. Do not submit unlawful, harmful, or personally sensitive information. We reserve the right to remove content that violates our policies or the law.
</p>


        
        <div className="pt-2">
          <Link href="/" className="text-sm text-gray-600 hover:underline">Back to Home</Link>
        </div>


        </div>
      </div>
    </div>
  );
}
