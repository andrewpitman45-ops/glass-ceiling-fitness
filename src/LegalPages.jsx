const legalPages = {
  terms: {
    title: 'Terms of Use / EULA',
    intro: 'Effective date: October 2, 2026. This Agreement governs access to and use of the You\'re With Us Fitness website, application, and related services (“Service”). By creating an account, accessing, or using the Service, you agree to this Agreement. If you do not agree, do not use the Service.',
    sections: [
      ['1. Eligibility and accounts', [
        'Provide accurate information when creating an account and keep your password secure. You may not access another person’s account without authorization.',
        'You\'re With Us Fitness may restrict, suspend, reject, or terminate accounts when reasonably necessary to protect the Service, its users, or comply with applicable law.',
      ]],
      ['2. License to use the Service', [
        'You\'re With Us Fitness grants you a limited, personal, non-exclusive, non-transferable, and revocable license to use the Service for its intended purposes.',
        'This Agreement does not transfer ownership of the Service, software, branding, designs, content, or intellectual property to you.',
      ]],
      ['3. Fitness and health disclaimer', [
        'You\'re With Us Fitness provides fitness, exercise, nutrition-tracking, and wellness-related tools for informational and educational purposes.',
        'The Service is not medical advice and is not a substitute for professional medical care, diagnosis, or treatment.',
        'Exercise involves inherent risks, including injury. You are responsible for determining whether an exercise or activity is appropriate for you. Consult an appropriate healthcare professional before beginning or substantially changing an exercise or nutrition program, particularly if you have a medical condition, injury, physical limitation, take medication, are pregnant, or have other health concerns. Stop exercising and seek appropriate medical attention if you experience symptoms that may require medical evaluation.',
      ]],
      ['4. Workout and nutrition information', [
        'Workout plans, calorie estimates, nutrition information, exercise recommendations, progress calculations, and similar information may contain inaccuracies and should be treated as estimates where applicable.',
        'Individual results vary. You\'re With Us Fitness does not guarantee weight loss, muscle gain, fitness improvements, health outcomes, or other specific results.',
      ]],
      ['5. User content and photos', [
        'You retain ownership of photos, captions, profile information, workout information, and other content you submit (“User Content”). You grant You\'re With Us Fitness a limited license to store, process, transmit, and display User Content only as reasonably necessary to operate and provide the Service.',
        'You are responsible for content you upload and must have the necessary rights and permissions to share it. Do not upload unlawful, threatening, abusive, sexually exploitative, malicious, fraudulent, or privacy- or intellectual-property-infringing content.',
      ]],
      ['6. Friends and private sharing', [
        'Some features let users connect and privately share content. The Service uses technical measures to restrict private content according to its intended permissions, but no online service or storage system can guarantee absolute security.',
        'Do not upload information or photographs you are unwilling to store electronically.',
      ]],
      ['7. Acceptable use', [
        'Do not attempt unauthorized access; scrape, probe, attack, overload, spam, or interfere with the Service; circumvent security or usage limits; upload malware; abuse the Service with automation; impersonate another person; or use the Service unlawfully. Accounts that violate these requirements may be restricted or terminated.',
      ]],
      ['8. Artificial intelligence', [
        'If features use artificial intelligence or automated systems, their output may be inaccurate, incomplete, or inappropriate for your circumstances. Independently evaluate important information. Do not rely on automated output as medical advice, diagnosis, or treatment.',
      ]],
      ['9. Third-party services', [
        'The Service may rely on third-party providers for hosting, authentication, databases, storage, analytics, email, or other infrastructure. Those services may have their own terms and privacy practices. You\'re With Us Fitness is not responsible for outages or failures caused solely by third parties beyond its reasonable control.',
      ]],
      ['10. Privacy', [
        'Collection and use of personal information is described in the You\'re With Us Fitness Privacy Policy, which forms part of your use of the Service.',
      ]],
      ['11. Intellectual property', [
        'Except for User Content and third-party materials, You\'re With Us Fitness and its licensors retain all rights in the Service, including its software, branding, logos, graphics, interface, and original content.',
        'You may not copy, sell, redistribute, reverse engineer, or commercially exploit protected portions of the Service except as permitted by applicable law or with written authorization.',
      ]],
      ['12. Availability and changes', [
        'The Service may be modified, updated, interrupted, restricted, or discontinued. Continuous or error-free availability is not guaranteed. Features may be added, removed, or changed.',
      ]],
      ['13. Suspension and termination', [
        'You\'re With Us Fitness may suspend or terminate access for violations of this Agreement, security concerns, unlawful activity, abuse of other users, or misuse of the Service. You may stop using the Service at any time.',
        'Account and data deletion requests will be handled according to the Privacy Policy and applicable law.',
      ]],
      ['14. Disclaimer of warranties', [
        'To the maximum extent permitted by law, the Service is provided “as is” and “as available.” You\'re With Us Fitness disclaims warranties not expressly provided in this Agreement, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement, to the extent permitted by law.',
        'Some jurisdictions do not permit certain warranty exclusions, so some exclusions may not apply to you.',
      ]],
      ['15. Limitation of liability', [
        'To the maximum extent permitted by applicable law, You\'re With Us Fitness and its owners, employees, contractors, and affiliates will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the Service.',
        'Nothing in this Agreement excludes or limits liability that cannot legally be excluded or limited.',
      ]],
      ['16. Indemnification', [
        'To the extent permitted by law, you agree to indemnify and hold harmless You\'re With Us Fitness and its owners, employees, contractors, and affiliates from third-party claims arising from your unlawful use of the Service, your User Content, or your material violation of this Agreement.',
      ]],
      ['17. Changes to this Agreement', [
        'This Agreement may be updated periodically. When legally required or when material changes are made, users will receive appropriate notice. Continued use after an updated Agreement becomes effective constitutes acceptance where permitted by law.',
      ]],
      ['18. Governing law', [
        'This Agreement is governed by the laws of the Commonwealth of Massachusetts, without regard to conflict-of-law principles, except where applicable law requires otherwise. Venue and dispute-resolution provisions should be reviewed by qualified legal counsel before publication.',
      ]],
      ['19. Severability', [
        'If any provision is found unenforceable, the remaining provisions will remain in effect to the extent permitted by law.',
      ]],
      ['20. Entire agreement', [
        'This Agreement, together with the Privacy Policy and any other policies expressly incorporated into it, constitutes the agreement between you and You\'re With Us Fitness regarding use of the Service.',
      ]],
      ['21. Contact', [
        'Questions about this Agreement may be directed to Andrewpitman46@outlook.com.',
      ]],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'Effective date: October 2, 2026',
    sections: [
      ['Information you provide', [
        'Account registration uses your email address and authentication data. Your profile may include your name, fitness goal, selected pathway, and body weight.',
        'The app stores fitness and wellness information you choose to enter, such as workouts, workout history, calorie-burn and food logs, nutrition notes, and weight entries. If you use social features, it also processes friend requests, directory name details, photo uploads, and captions.',
      ]],
      ['How information is used', [
        'Information is used to authenticate your account, display and save your profile and logs, calculate estimates, provide friend and photo features you request, and operate and protect the Service.',
        'Food searches send the search term to Open Food Facts to return matching food products. Do not enter sensitive personal information in a food search.',
      ]],
      ['Service providers and sharing', [
        'Account authentication, database storage, and photo storage are provided through Supabase. When you use food search, the search is sent to Open Food Facts. These providers process information as needed to provide their services and may have separate privacy terms.',
        'Friend content is shared with the users and for the purposes shown by the relevant friend feature. We do not sell personal information. We do not share profile or health-related entries with friends unless you choose to use a sharing feature for that content.',
      ]],
      ['Retention and deletion', [
        'Information is retained in your account while it is used to provide the Service. To request deletion of your account or saved information, email Andrewpitman46@outlook.com from your account email. Some records may remain temporarily in backups or be retained where required by law.',
        'Deleting an account may not automatically remove separately stored uploaded files; contact us to request removal of associated content.',
      ]],
      ['Security', [
        'The Service uses account-based access controls and provider security features. No online transmission or storage system can be guaranteed completely secure. Use a unique password and avoid uploading information you would not want stored online.',
      ]],
      ['Your choices', [
        'You can edit profile information and remove individual food, activity, or weight entries in the app. Contact us to request access, correction, or deletion where available under applicable law.',
      ]],
      ['Children', [
        'The Service is not directed to children under 13, and we do not knowingly collect personal information from children under 13. A parent or guardian who believes a child has provided information may contact us to request its removal.',
      ]],
      ['Policy changes and contact', [
        'We may update this Privacy Policy and will provide notice of material changes when required. Questions or privacy requests: Andrewpitman46@outlook.com.',
      ]],
    ],
  },
  disclaimer: {
    title: 'Fitness & Health Disclaimer',
    intro: 'Effective date: October 2, 2026',
    sections: [
      ['Not medical advice', [
        'You\'re With Us Fitness is an informational and educational service. Its workouts, exercise descriptions, nutrition logs, calorie estimates, and progress tools are not medical advice and do not diagnose, treat, or prevent any condition.',
      ]],
      ['Consult a professional', [
        'Consult a qualified healthcare professional before beginning or changing an exercise or nutrition program, especially if you have a health condition, injury, disability, physical limitation, take medication, are pregnant, or have other health concerns. Seek individualized guidance on safe adaptations when needed.',
      ]],
      ['Exercise risks', [
        'Physical activity carries risk, including injury. You are responsible for selecting appropriate activities, equipment, intensity, and modifications. Stop activity if you experience pain, dizziness, shortness of breath beyond expected exertion, or other concerning symptoms, and seek medical attention as appropriate.',
      ]],
      ['Estimates and results', [
        'Calories burned, nutrition data, workout recommendations, and progress measures are estimates and may be inaccurate. Individual responses vary. No particular result is promised or guaranteed.',
      ]],
      ['Contact', [
        'For questions about the Service, email Andrewpitman46@outlook.com. For health concerns, contact a qualified healthcare professional.',
      ]],
    ],
  },
  community: {
    title: 'Community & User Content Rules',
    intro: 'Effective date: October 2, 2026',
    sections: [
      ['Be respectful', [
        'Treat members respectfully. Harassment, threats, hateful conduct, bullying, or unwanted sexual content are not allowed.',
      ]],
      ['Share responsibly', [
        'Only upload content you own or have permission to share. Do not post another person’s image, personal information, or private messages without their permission.',
        'Do not upload unlawful, abusive, exploitative, fraudulent, deceptive, or sexually explicit content, or content that violates another person’s privacy or intellectual-property rights.',
      ]],
      ['Keep the service safe', [
        'Do not impersonate another person, spam members, promote scams, upload malware, probe accounts, or attempt to bypass privacy or security controls.',
      ]],
      ['Report and enforcement', [
        'Email Andrewpitman46@outlook.com to report content or behavior. Include enough detail to identify the issue, but do not send unnecessary sensitive information.',
        'You\'re With Us Fitness may remove content or restrict accounts when reasonably necessary to protect members, the Service, or comply with law.',
      ]],
    ],
  },
  contact: {
    title: 'Contact',
    intro: 'You\'re With Us Fitness',
    sections: [
      ['Email', [
        'For support, privacy requests, legal questions, or community reports, email Andrewpitman46@outlook.com.',
      ]],
    ],
  },
}

export default function LegalPage({ page = 'terms', onBack }) {
  const legalPageKeys = Object.keys(legalPages)
  const content = legalPages[page] || legalPages.terms
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <a className="legal-brand" href="/" aria-label="You're With Us Fitness home">YOU'RE WITH US FITNESS</a>
        {onBack && <button className="secondary-button" type="button" onClick={onBack}>Back</button>}
      </header>
      <article className="legal-document">
        <p className="card-kicker">YOU'RE WITH US FITNESS</p>
        <h1>{content.title}</h1>
        <p className="legal-effective">{content.intro}</p>
        {content.sections.map(([heading, paragraphs]) => (
          <section className="legal-section" key={heading}>
            <h2>{heading}</h2>
            {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        {page === 'contact' && <a className="legal-contact-link" href="mailto:Andrewpitman46@outlook.com">Email You're With Us Fitness</a>}
        <nav className="legal-links" aria-label="Legal pages">
          {legalPageKeys.map(key => (
            <a key={key} href={`?legal=${key}`}>{legalPages[key].title}</a>
          ))}
        </nav>
      </article>
    </main>
  )
}
