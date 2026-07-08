import type {
  SprintStore, SprintTask, SkillItem, ProfileChanges, AnalyticsEntry, GigTrack,
  HabitDefinition, MessageTemplate, SeptemberScalePlan, SprintGoal, CompetitorWatch, SeoKeyword,
} from './types'

const now = () => new Date().toISOString()
const today = '2026-07-08'
const ts = (d: string) => `${d}T12:00:00.000Z`

function task(
  id: string,
  title: string,
  section: SprintTask['section'],
  priority: SprintTask['priority'],
  status: SprintTask['status'],
  extra: Partial<SprintTask> = {},
): SprintTask {
  return {
    id,
    title,
    section,
    priority,
    status,
    dueDate: extra.dueDate ?? today,
    duration: extra.duration ?? '15m',
    estimatedMinutes: extra.estimatedMinutes ?? 15,
    labels: extra.labels ?? [],
    description: extra.description,
    notes: extra.notes,
    impact: extra.impact ?? 'medium',
    effort: extra.effort ?? 's',
    checklist: extra.checklist,
    completedAt: status === 'done' ? (extra.completedAt ?? ts(today)) : undefined,
    createdAt: ts('2026-07-07'),
    updatedAt: now(),
    ...extra,
  }
}

export const RECOMMENDED_TITLE =
  'Shopify, 3D Product Configurator & AI Automation Developer'

export const RECOMMENDED_DESCRIPTION = `Hi, I'm Enis, a full-stack developer focused on Shopify product configurators, 3D/2D product customizers, AI automations, and custom web portals. I help businesses turn complex options, pricing rules, uploads, variants, dashboards, and workflows into clean systems that are easy to use.

For complex projects, I first confirm the scope, assets, timeline, and technical details before starting, so expectations stay clear. My goal is to build reliable, modern, business-ready solutions that are easy to maintain.`

export const TRUST_LINE =
  'For complex projects, I first confirm the scope, required assets, timeline, and technical details before starting, so the work stays organized and expectations are clear.'

const STRONG_SKILLS = [
  'Shopify Development', 'Shopify', 'React', 'JavaScript', 'TypeScript', 'Three.js',
  'WebGL', 'PHP 8', 'REST API', 'MySQL', 'Supabase', 'Firebase', 'AI Automation',
  'API Integration', 'Dashboard Development', 'Web App Development',
]

const WEAK_SKILLS = [
  'WordPress', 'Payment gateway', 'Basic HTML', 'Basic CSS',
]

export function createSeedStore(): SprintStore {
  const skills: SkillItem[] = [
    ...STRONG_SKILLS.map((name, i) => ({
      id: `skill-s-${i}`,
      name,
      category: 'strong' as const,
      action: 'keep' as const,
    })),
    ...WEAK_SKILLS.map((name, i) => ({
      id: `skill-w-${i}`,
      name,
      category: 'weak' as const,
      action: 'review' as const,
    })),
  ]

  const profile: ProfileChanges = {
    previousTitle: '',
    newTitle: RECOMMENDED_TITLE,
    previousDescription: '',
    newDescription: RECOMMENDED_DESCRIPTION,
    trustLine: TRUST_LINE,
    trustLineAdded: true,
    weakServicesRemoved: false,
    skillsUpdated: false,
    beforeScreenshotUrl: '',
    afterScreenshotUrl: '',
    notes: 'Profile title, description, and trust line updated on Jul 8.',
    profileScore: 62,
    lastAuditAt: today,
    updatedAt: now(),
  }

  const tasks: SprintTask[] = [
    // Done — today
    task('t-done-1', 'Screenshot current Fiverr profile', '00', 'P1', 'done', {
      labels: ['profile', 'proof'], impact: 'high', duration: '5m', estimatedMinutes: 5,
    }),
    task('t-done-2', 'Buyer-scan your profile in 5 seconds', '00', 'P1', 'done', {
      labels: ['profile'], impact: 'high', duration: '5m', estimatedMinutes: 5,
      description: 'Open profile as a buyer would. What do you notice in 5 seconds?',
    }),
    task('t-done-3', 'Change Fiverr profile title', '02', 'P1', 'done', {
      labels: ['profile'], impact: 'critical', duration: '10m', estimatedMinutes: 10,
    }),
    task('t-done-4', 'Rewrite Fiverr profile description', '02', 'P1', 'done', {
      labels: ['profile'], impact: 'critical', duration: '25m', estimatedMinutes: 25,
    }),
    task('t-done-5', 'Add trust/process line to profile and gigs', '02', 'P1', 'done', {
      labels: ['profile', 'trust'], impact: 'high', duration: '10m', estimatedMinutes: 10,
    }),
    task('t-done-6', 'Capture after-change profile screenshots', '00', 'P1', 'done', {
      labels: ['profile', 'proof'], impact: 'medium', duration: '5m', estimatedMinutes: 5,
    }),

    // Open — today / next
    task('t-open-1', 'Record baseline Fiverr analytics', '09', 'P1', 'todo', {
      labels: ['analytics', 'baseline'], impact: 'critical', duration: '20m', estimatedMinutes: 20,
      description: 'Log impressions, clicks, messages, orders as your Jul 8 baseline.',
      checklist: [
        { id: 'c1', text: 'Open Fiverr analytics', done: false },
        { id: 'c2', text: 'Copy impressions / clicks / messages / orders', done: false },
        { id: 'c3', text: 'Save baseline entry in dashboard', done: false },
      ],
    }),
    task('t-open-2', 'Remove weak/general services from profile focus', '02', 'P1', 'todo', {
      labels: ['profile', 'skills'], impact: 'high', duration: '20m', estimatedMinutes: 20,
    }),
    task('t-open-3', 'Make one small Fiverr improvement', '01', 'P2', 'todo', {
      labels: ['habit', 'daily'], impact: 'medium', duration: '15m', estimatedMinutes: 15,
    }),
    task('t-open-4', 'Check Fiverr inbox and reply fast', '01', 'P1', 'todo', {
      labels: ['habit', 'inbox'], impact: 'high', duration: '15m', estimatedMinutes: 15,
    }),
    task('t-open-5', 'Scan one competitor in your niche', '01', 'P2', 'todo', {
      labels: ['habit', 'competitors'], impact: 'medium', duration: '20m', estimatedMinutes: 20,
    }),
    task('t-open-6', 'Follow up with old Fiverr leads', '01', 'P2', 'todo', {
      labels: ['habit', 'leads'], impact: 'high', duration: '20m', estimatedMinutes: 20,
    }),

    // Profile cleanup remaining
    task('t-p-1', 'Audit and clean skills list (keep strong / remove weak)', '02', 'P1', 'todo', {
      dueDate: '2026-07-09', labels: ['profile', 'skills'], impact: 'high', duration: '30m', estimatedMinutes: 30,
    }),
    task('t-p-2', 'Align profile languages and response time settings', '02', 'P3', 'todo', {
      dueDate: '2026-07-10', labels: ['profile'], impact: 'low', duration: '10m', estimatedMinutes: 10,
    }),

    // Gig rebuild
    task('t-g-1', 'Rewrite Shopify Configurator gig title + description', '03', 'P1', 'todo', {
      dueDate: '2026-07-14', labels: ['gig', 'shopify'], impact: 'critical', duration: '45m', estimatedMinutes: 45,
      relatedGigId: 'gig-shopify',
    }),
    task('t-g-2', 'Rewrite AI Automation gig title + description', '03', 'P1', 'todo', {
      dueDate: '2026-07-16', labels: ['gig', 'ai'], impact: 'critical', duration: '45m', estimatedMinutes: 45,
      relatedGigId: 'gig-ai',
    }),
    task('t-g-3', 'Rewrite Custom Portal / SaaS gig title + description', '03', 'P1', 'todo', {
      dueDate: '2026-07-18', labels: ['gig', 'portal'], impact: 'critical', duration: '45m', estimatedMinutes: 45,
      relatedGigId: 'gig-portal',
    }),
    task('t-g-4', 'Define Basic / Standard / Premium packages for all 3 gigs', '04', 'P1', 'todo', {
      dueDate: '2026-07-21', labels: ['gig', 'offers'], impact: 'high', duration: '60m', estimatedMinutes: 60,
    }),
    task('t-g-5', 'Design 3 high-converting thumbnails', '04', 'P1', 'todo', {
      dueDate: '2026-07-23', labels: ['gig', 'thumbnail'], impact: 'high', duration: '90m', estimatedMinutes: 90,
    }),
    task('t-g-6', 'Write FAQ sets for each money lane', '04', 'P2', 'todo', {
      dueDate: '2026-07-25', labels: ['gig', 'faq'], impact: 'medium', duration: '40m', estimatedMinutes: 40,
    }),

    // Gallery + video
    task('t-v-1', 'Collect 6–9 gallery images per gig', '05', 'P1', 'todo', {
      dueDate: '2026-07-28', labels: ['proof', 'gallery'], impact: 'high', duration: '2h', estimatedMinutes: 120,
    }),
    task('t-v-2', 'Record 60–90s intro video for top gig', '05', 'P1', 'todo', {
      dueDate: '2026-08-01', labels: ['proof', 'video'], impact: 'critical', duration: '2h', estimatedMinutes: 120,
    }),

    // Demo / portfolio
    task('t-d-1', 'Ship Shopify configurator demo (or GIF walkthrough)', '06', 'P1', 'todo', {
      dueDate: '2026-08-05', labels: ['demo', 'shopify'], impact: 'critical', duration: '4h', estimatedMinutes: 240,
      relatedGigId: 'gig-shopify',
    }),
    task('t-d-2', 'Ship AI automation demo workflow screenshots', '06', 'P1', 'todo', {
      dueDate: '2026-08-08', labels: ['demo', 'ai'], impact: 'high', duration: '3h', estimatedMinutes: 180,
      relatedGigId: 'gig-ai',
    }),
    task('t-d-3', 'Ship portal/SaaS dashboard demo screens', '06', 'P2', 'todo', {
      dueDate: '2026-08-12', labels: ['demo', 'portal'], impact: 'high', duration: '3h', estimatedMinutes: 180,
      relatedGigId: 'gig-portal',
    }),

    // SEO + case studies
    task('t-s-1', 'Build keyword map for 3 money lanes', '07', 'P1', 'todo', {
      dueDate: '2026-08-10', labels: ['seo'], impact: 'high', duration: '60m', estimatedMinutes: 60,
    }),
    task('t-s-2', 'Write 1 case study (problem → process → result)', '07', 'P1', 'todo', {
      dueDate: '2026-08-15', labels: ['seo', 'case-study'], impact: 'high', duration: '90m', estimatedMinutes: 90,
    }),
    task('t-s-3', 'Add SEO keywords into gig titles/tags/descriptions', '07', 'P2', 'todo', {
      dueDate: '2026-08-18', labels: ['seo'], impact: 'medium', duration: '45m', estimatedMinutes: 45,
    }),

    // Buyer messages
    task('t-b-1', 'Save and refine all reply templates', '08', 'P1', 'todo', {
      dueDate: '2026-07-12', labels: ['leads', 'templates'], impact: 'high', duration: '40m', estimatedMinutes: 40,
    }),
    task('t-b-2', 'Create custom offer structure checklist', '08', 'P2', 'todo', {
      dueDate: '2026-07-15', labels: ['leads', 'offers'], impact: 'medium', duration: '30m', estimatedMinutes: 30,
    }),
    task('t-b-3', 'Follow up 5 warm leads this week', '08', 'P1', 'todo', {
      dueDate: '2026-07-13', labels: ['leads'], impact: 'critical', duration: '45m', estimatedMinutes: 45,
    }),

    // Analytics + scale
    task('t-a-1', 'Weekly analytics review (every Friday)', '09', 'P2', 'todo', {
      dueDate: '2026-07-11', labels: ['analytics', 'weekly'], impact: 'medium', duration: '30m', estimatedMinutes: 30,
    }),
    task('t-a-2', 'Draft September scale plan with revenue targets', '09', 'P1', 'todo', {
      dueDate: '2026-08-20', labels: ['scale'], impact: 'high', duration: '60m', estimatedMinutes: 60,
    }),
    task('t-a-3', 'Compare current metrics vs Jul 8 baseline', '09', 'P1', 'todo', {
      dueDate: '2026-08-25', labels: ['analytics'], impact: 'high', duration: '30m', estimatedMinutes: 30,
    }),
  ]

  const analytics: AnalyticsEntry[] = [
    {
      id: 'analytics-baseline',
      date: today,
      impressions: undefined,
      clicks: undefined,
      messages: undefined,
      orders: undefined,
      conversionRate: undefined,
      bestGig: '',
      worstGig: '',
      changesMadeToday:
        'Updated profile title; Rewrote profile description; Added trust/process line; Took before/after screenshots',
      notes: 'Baseline day — fill numeric fields from Fiverr analytics.',
      isBaseline: true,
    },
  ]

  const gigs: GigTrack[] = [
    {
      id: 'gig-shopify',
      lane: 'Shopify Product Configurator',
      gigTitle: 'I will build a custom Shopify product configurator with 2D 3D pricing and variants',
      description:
        'Custom Shopify product configurators with 2D/3D preview, variants, pricing logic, uploads, colors, materials, and cart integration.',
      status: 'in_progress',
      thumbnailStatus: 'not_started',
      descriptionStatus: 'in_progress',
      packagesStatus: 'not_started',
      faqStatus: 'not_started',
      galleryStatus: 'not_started',
      videoStatus: 'not_started',
      seoKeywords: 'shopify product configurator, 3D product customizer, shopify variants pricing',
      targetKeywords: ['shopify product configurator', '3d product customizer', 'shopify custom options'],
      priceBasic: 350,
      priceStandard: 750,
      pricePremium: 1500,
      readinessScore: 18,
      notes: 'Primary money lane. Lead with demos + gallery.',
      nextAction: 'Finish description rewrite + package tiers',
      lastUpdated: now(),
    },
    {
      id: 'gig-ai',
      lane: 'AI Automation',
      gigTitle: 'I will build n8n Make Zapier AI automation workflows for your business',
      description:
        'n8n, Make, Zapier, AI agents, workflow automations, CRM automations, Shopify automations, API integrations, and business process automation.',
      status: 'not_started',
      thumbnailStatus: 'not_started',
      descriptionStatus: 'not_started',
      packagesStatus: 'not_started',
      faqStatus: 'not_started',
      galleryStatus: 'not_started',
      videoStatus: 'not_started',
      seoKeywords: 'n8n automation, make.com zapier, ai agent workflow',
      targetKeywords: ['n8n automation', 'zapier ai workflow', 'make.com automation'],
      priceBasic: 200,
      priceStandard: 500,
      pricePremium: 1200,
      readinessScore: 5,
      notes: 'Second money lane. Emphasize business outcomes.',
      nextAction: 'Draft gig title + outcome-focused description',
      lastUpdated: now(),
    },
    {
      id: 'gig-portal',
      lane: 'Custom Web Portal / SaaS Dashboard',
      gigTitle: 'I will build a custom web portal dashboard or SaaS MVP with React and PHP',
      description:
        'Client portals, admin dashboards, SaaS MVPs, internal business tools, PHP/React dashboards, user roles, file uploads, payments, and API systems.',
      status: 'not_started',
      thumbnailStatus: 'not_started',
      descriptionStatus: 'not_started',
      packagesStatus: 'not_started',
      faqStatus: 'not_started',
      galleryStatus: 'not_started',
      videoStatus: 'not_started',
      seoKeywords: 'custom web portal, saas dashboard, react php mvp',
      targetKeywords: ['custom web portal', 'saas mvp dashboard', 'client portal react'],
      priceBasic: 500,
      priceStandard: 1200,
      pricePremium: 3000,
      readinessScore: 5,
      notes: 'Higher-ticket lane. Needs strong demos.',
      nextAction: 'Outline MVP package scope',
      lastUpdated: now(),
    },
  ]

  const habits: HabitDefinition[] = [
    { id: 'habit-inbox', title: 'Check Fiverr inbox and reply fast', description: 'Reply within 1 hour when possible', frequency: 'daily', section: '01', points: 10 },
    { id: 'habit-improve', title: 'Make one small Fiverr improvement', description: 'Any profile/gig/SEO micro-win', frequency: 'daily', section: '01', points: 10 },
    { id: 'habit-competitor', title: 'Scan one competitor in your niche', description: 'Note 1 strength + 1 weakness', frequency: 'daily', section: '01', points: 8 },
    { id: 'habit-followup', title: 'Follow up with old Fiverr leads', description: 'At least 1 warm follow-up', frequency: 'daily', section: '01', points: 12 },
    { id: 'habit-analytics', title: 'Weekly Fiverr analytics review', description: 'Compare vs baseline', frequency: 'weekly', weekday: 5, section: '01', points: 15 },
    { id: 'habit-friday', title: 'Friday progress recap', description: 'Wins, blockers, next focus', frequency: 'weekly', weekday: 5, section: '01', points: 15 },
  ]

  const templates: MessageTemplate[] = [
    {
      id: 'tpl-1', title: 'First reply template', category: 'reply',
      variables: ['name', 'project'],
      body: `Hi {{name}}, thanks for reaching out!

I'd love to help with your {{project}}. To give you an accurate plan and timeline, could you share:
1) What the final result should look like
2) Any examples / references
3) Deadline
4) Budget range

Once I have that, I'll send a clear scope + next steps.`,
    },
    {
      id: 'tpl-2', title: 'Follow-up template', category: 'followup',
      variables: ['name'],
      body: `Hi {{name}}, just following up on my last message.

Happy to adjust the approach if your priorities changed. If you're still interested, I can send a short custom offer today.`,
    },
    {
      id: 'tpl-3', title: 'Scope clarification template', category: 'reply',
      variables: ['name'],
      body: `Thanks {{name}}. To keep the project clean, I usually confirm:
• Exact features / options needed
• Assets you already have (3D models, images, brand files)
• Integrations (Shopify cart, CRM, APIs)
• Timeline + revision rounds

Reply with those and I'll lock a precise offer.`,
    },
    {
      id: 'tpl-4', title: 'Price objection reply', category: 'objection',
      variables: ['name'],
      body: `Totally understand, {{name}}. Pricing reflects the complexity (logic, UX, integrations, testing).

I can also propose a phased MVP so you get a working first version faster, then we expand. Want me to outline a leaner Phase 1?`,
    },
    {
      id: 'tpl-5', title: 'Timeline objection reply', category: 'objection',
      variables: ['name', 'days'],
      body: `I can prioritize this. A realistic delivery for a solid first version is about {{days}} days after scope + assets are confirmed.

If you need something sooner, we can ship a reduced MVP first. Which features are must-have for launch?`,
    },
    {
      id: 'tpl-6', title: '“No 3D model” reply', category: 'objection',
      variables: ['name'],
      body: `No problem, {{name}} — we can start with 2D / image-based configuration, or I can help source / prepare a simple 3D model.

Many clients begin without a finished model and upgrade later. Want me to recommend the best path for your product?`,
    },
    {
      id: 'tpl-7', title: 'Custom offer structure', category: 'offer',
      variables: ['name', 'project'],
      body: `Custom Offer — {{project}}

Scope:
• …
• …

Deliverables:
• …

Timeline: X days after assets confirmed
Revisions: X rounds
Price: $X

Next step: confirm assets + approve offer and I'll start immediately.`,
    },
  ]

  const septemberPlan: SeptemberScalePlan = {
    goals: 'Turn cleaned profile + 3 money-lane gigs into consistent qualified buyer flow.',
    targetGigs: 'Shopify Configurator (primary), AI Automation (secondary), Portal/SaaS (high-ticket).',
    pricingStrategy: 'Value-based packages; protect premium with clear scope gates and discovery.',
    outreachPlan: 'Daily inbox + warm lead follow-ups; custom offers for hot leads.',
    proofAssetsNeeded: 'Demos, gallery, video, 1–2 case studies, before/after profile proof.',
    monthlyRevenueTarget: 5000,
    weeklyMessageTarget: 15,
    weeklyOrderTarget: 2,
    milestones: [
      { id: 'm1', title: 'All 3 gigs live with packages + thumbnails', dueDate: '2026-08-01', done: false },
      { id: 'm2', title: 'At least 1 demo per money lane', dueDate: '2026-08-15', done: false },
      { id: 'm3', title: 'Baseline vs current analytics review', dueDate: '2026-08-25', done: false },
      { id: 'm4', title: 'September scale plan locked', dueDate: '2026-09-01', done: false },
    ],
    notes: '',
    updatedAt: now(),
  }

  const goals: SprintGoal[] = [
    { id: 'goal-1', title: 'Sprint task completion', metric: 'tasks_done', target: 100, current: 0, unit: '%' },
    { id: 'goal-2', title: 'Profile readiness', metric: 'profile_score', target: 90, current: 62, unit: 'score' },
    { id: 'goal-3', title: 'Gig readiness average', metric: 'gig_readiness', target: 80, current: 9, unit: '%' },
    { id: 'goal-4', title: 'Warm/hot leads in pipeline', metric: 'warm_leads', target: 10, current: 0, unit: 'leads' },
    { id: 'goal-5', title: 'Proof assets collected', metric: 'proof_assets', target: 12, current: 0, unit: 'assets' },
  ]

  const competitors: CompetitorWatch[] = [
    {
      id: 'comp-1',
      username: '(add competitor)',
      niche: 'Shopify configurator',
      strengths: '',
      weaknesses: '',
      priceRange: '',
      notes: 'Scan one competitor daily and fill this in.',
      rating: 0,
      reviews: 0,
      threatLevel: 'medium',
      thumbnailNotes: '',
      lastChecked: today,
    },
  ]

  const seoKeywords: SeoKeyword[] = [
    { id: 'kw-1', keyword: 'shopify product configurator', gigId: 'gig-shopify', gigLane: 'Shopify Product Configurator', intent: 'primary', status: 'research', difficulty: 7, usedInTitle: false, usedInTags: false, usedInDescription: false },
    { id: 'kw-2', keyword: '3d product customizer', gigId: 'gig-shopify', gigLane: 'Shopify Product Configurator', intent: 'primary', status: 'research', difficulty: 6, usedInTitle: false, usedInTags: false, usedInDescription: false },
    { id: 'kw-3', keyword: 'n8n automation', gigId: 'gig-ai', gigLane: 'AI Automation', intent: 'primary', status: 'research', difficulty: 5, usedInTitle: false, usedInTags: false, usedInDescription: false },
    { id: 'kw-4', keyword: 'zapier ai workflow', gigId: 'gig-ai', gigLane: 'AI Automation', intent: 'secondary', status: 'research', difficulty: 4, usedInTitle: false, usedInTags: false, usedInDescription: false },
    { id: 'kw-5', keyword: 'custom web portal', gigId: 'gig-portal', gigLane: 'Custom Web Portal / SaaS Dashboard', intent: 'primary', status: 'research', difficulty: 6, usedInTitle: false, usedInTags: false, usedInDescription: false },
    { id: 'kw-6', keyword: 'saas mvp dashboard', gigId: 'gig-portal', gigLane: 'Custom Web Portal / SaaS Dashboard', intent: 'secondary', status: 'research', difficulty: 5, usedInTitle: false, usedInTags: false, usedInDescription: false },
  ]

  return {
    version: 2,
    tasks,
    profile,
    skills,
    analytics,
    gigs,
    habitLogs: [],
    habits,
    leads: [],
    templates,
    proofAssets: [],
    weeklyReviews: [],
    septemberPlan,
    competitors,
    seoKeywords,
    activity: [
      {
        id: 'act-seed',
        type: 'note',
        title: 'Sprint initialized',
        detail: 'Fiverr Growth Sprint Jul 7–Sep 1 seeded with profile wins + open baseline task.',
        at: now(),
      },
    ],
    quickNotes: [
      {
        id: 'note-1',
        text: 'Next best action: Record baseline Fiverr analytics.',
        pinned: true,
        createdAt: now(),
      },
    ],
    goals,
    lastUpdated: now(),
  }
}
