import type { Lead, TeamMember, Target, Okr, Campaign, ContentItem, Notification, WaConversation, SupportTicket, DesignTask, TeamMemberInfo, MediaItem, Realtor, Influencer, Roles, Periods } from './types'

export const DEFAULT_LEADS: Lead[] = []

export const TEAM: TeamMember[] = [
  {n:"Emeka Obi — Sales Rep",pct:92,col:"#059669",st:"On target"},
  {n:"Digital Marketer",pct:85,col:"#059669",st:"On target"},
  {n:"Peace C. — Coordinator",pct:88,col:"#059669",st:"On target"},
  {n:"Content Director",pct:78,col:"#D97706",st:"Close"},
  {n:"Business Developer",pct:70,col:"#D97706",st:"Close"},
  {n:"Customer Care",pct:95,col:"#059669",st:"On target"},
  {n:"Graphic Designer",pct:65,col:"#DC2626",st:"Below target"},
  {n:"Sales Rep 2 — Chioma",pct:72,col:"#D97706",st:"Close"},
]

export const DEFAULT_TARGETS: Target[] = [
  {label:"Leads generated",target:"100",actual:"127",pct:127,col:"#059669"},
  {label:"Leads contacted within 2h",target:"100%",actual:"91%",pct:91,col:"#D97706"},
  {label:"Content pieces published",target:"20",actual:"17",pct:85,col:"#D97706"},
  {label:"Deals closed",target:"5",actual:"4",pct:80,col:"#D97706"},
  {label:"Revenue closed",target:"₦21.25M",actual:"₦14.2M",pct:67,col:"#DC2626"},
  {label:"New Benji vendors onboarded",target:"10",actual:"6",pct:60,col:"#DC2626"},
  {label:"Follow-up cadence compliance",target:"100%",actual:"84%",pct:84,col:"#D97706"},
]

export const OKR_DATA: Okr[] = [
  {obj:"O1 — Generate ₦85M monthly revenue across all divisions",krs:[
    {l:"Real Estate closes ₦30M/month",pct:93,col:"#059669"},
    {l:"Benji generates ₦15M/month",pct:47,col:"#DC2626"},
    {l:"Engineering closes ₦20M/month",pct:60,col:"#D97706"},
    {l:"Surveying closes ₦5M/month",pct:84,col:"#059669"},
  ]},
  {obj:"O2 — Consistently generate 100+ qualified leads per week",krs:[
    {l:"100+ leads/week for 8 consecutive weeks",pct:82,col:"#D97706"},
    {l:"100% of leads contacted within 2 hours",pct:91,col:"#059669"},
    {l:"Conversion rate reaches 25%",pct:73,col:"#D97706"},
  ]},
  {obj:"O3 — Build a world-class content machine",krs:[
    {l:"20 content pieces published every week",pct:68,col:"#D97706"},
    {l:"Average reach of 5,000+ per piece",pct:55,col:"#DC2626"},
    {l:"50+ WhatsApp broadcast responses/week",pct:76,col:"#D97706"},
  ]},
  {obj:"O4 — Activate and grow partner and media network",krs:[
    {l:"10 active realtor partners generating leads",pct:30,col:"#DC2626"},
    {l:"5 active influencer partnerships",pct:40,col:"#DC2626"},
    {l:"3 active radio/TV placements",pct:67,col:"#D97706"},
  ]},
]

export const CAMPAIGNS_DATA: Campaign[] = [
  {id:'C-1001',div:"re",name:"Bethel City Estate Launch",status:"active",budget:1000000,spent:680000,leads:68,cpl:"₦6.2K",conv:"19.2%",days:12,channels:"Facebook + Instagram"},
  {id:'C-1002',div:"ben",name:"ESUT Campus Activation",status:"active",budget:1100000,spent:385000,leads:142,cpl:"₦2.8K",conv:"—",days:19,channels:"TikTok + Field + Stickers"},
  {id:'C-1003',div:"eng",name:"Engineering Excellence Series",status:"draft",budget:350000,spent:0,leads:0,cpl:"—",conv:"—",days:null,channels:"LinkedIn + WhatsApp"},
  {id:'C-1004',div:"sur",name:"Know Your Land Campaign",status:"active",budget:200000,spent:140000,leads:28,cpl:"₦5K",conv:"28%",days:5,channels:"Facebook + WhatsApp"},
]

export const CONTENT_ITEMS: ContentItem[] = [
  {title:"Bethel City estate walkthrough",fmt:"Video",platform:"Instagram",div:"re",owner:"Williams F.",status:"Published",due:"Jul 14"},
  {title:'"Survey before you build"',fmt:"Carousel",platform:"Facebook",div:"sur",owner:"Creator",status:"Published",due:"Jul 14"},
  {title:"Benji delivery speed demo",fmt:"TikTok",platform:"TikTok",div:"ben",owner:"Williams F.",status:"In review",due:"Jul 15"},
  {title:"Client testimonial — Adaeze",fmt:"Graphic",platform:"Instagram",div:"re",owner:"Designer",status:"Briefed",due:"Jul 16"},
  {title:"Weekly property WA broadcast",fmt:"Text+Image",platform:"WhatsApp",div:"re",owner:"Sales Rep",status:"Overdue",due:"Jul 13"},
  {title:"Bomach OS feature spotlight",fmt:"Carousel",platform:"LinkedIn",div:"ict",owner:"Creator",status:"In progress",due:"Jul 17"},
  {title:"Benji vendor onboarding explainer",fmt:"Video",platform:"TikTok",div:"ben",owner:"Williams F.",status:"In progress",due:"Jul 15"},
  {title:"Engineering project showcase",fmt:"Carousel",platform:"Instagram",div:"eng",owner:"Designer",status:"In review",due:"Jul 16"},
]

export const REALTORS: Realtor[] = [
  {init:"CH",bg:"#DBEAFE",tc:"#1E40AF",name:"Chukwudi Habitat Agency",since:"Jan 2025",comm:"3%",phone:"08031234567",referrals:"₦14.2M",status:"active"},
  {init:"NE",bg:"#D1FAE5",tc:"#065F46",name:"Nwachukwu Estates Ltd",since:"Mar 2025",comm:"2.5%",phone:"07041234567",referrals:"₦8.7M",status:"active"},
  {init:"PP",bg:"#FEF3C7",tc:"#92400E",name:"Prime Properties Enugu",since:"—",comm:"3%",phone:"—",referrals:"—",status:"pending"},
  {init:"GH",bg:"#EDE9FE",tc:"#5B21B6",name:"Greater Horizons Realty",since:"Jun 2025",comm:"2%",phone:"08021234567",referrals:"₦3.1M",status:"active"},
]

export const INFLUENCERS: Influencer[] = [
  {init:"AO",bg:"#7C3AED",name:"Adaora Okafor",handle:"@adaora_enugu",platform:"Instagram + TikTok",followers:"48K",eng:"6.2%",niche:"Real Estate",rate:"₦180K/post",status:"active"},
  {init:"KN",bg:"#059669",name:"Kelechi Nwosu",handle:"@kelechi_foodie",platform:"TikTok + Instagram",followers:"112K",eng:"8.9%",niche:"Food / Benji",rate:"₦350K/post",status:"negotiation"},
  {init:"CI",bg:"#CC0000",name:"Chisom Igwe",handle:"@chisom_builds",platform:"YouTube + Instagram",followers:"29K",eng:"4.1%",niche:"Engineering",rate:"₦120K/post",status:"pending"},
  {init:"TM",bg:"#D97706",name:"Tochi Mbah",handle:"@tochi_enugu",platform:"Instagram",followers:"67K",eng:"5.8%",niche:"Lifestyle",rate:"₦220K/post",status:"active"},
]

export const DEFAULT_TICKETS: SupportTicket[] = [
  {id:"TK-041",name:"Ngozi Kamalu",issue:"Benji app not activating vendor account",div:"ben",priority:"urgent",time:"2h ago",assigned:"Customer Care",resolved:false},
  {id:"TK-040",name:"Adaeze Chukwu",issue:"Payment plan clarification request",div:"re",priority:"high",time:"4h ago",assigned:"Customer Care",resolved:false},
  {id:"TK-039",name:"Emeka Eze",issue:"Site visit rescheduling request",div:"eng",priority:"medium",time:"Yesterday",assigned:"Customer Care",resolved:false},
  {id:"TK-038",name:"Peter Ani",issue:"Technical issue with Bomach OS login",div:"ict",priority:"high",time:"Yesterday",assigned:"Tech Dept",resolved:false},
  {id:"TK-037",name:"Ifeoma Nze",issue:"Agriculture supply contract query",div:"agr",priority:"medium",time:"2 days ago",assigned:"Business Dev",resolved:false},
]

export const DEFAULT_WA_CONVS: WaConversation[] = [
  {id:"wa1",init:"AC",bg:"#DBEAFE",tc:"#1E40AF",name:"Adaeze Chukwu",time:"2m ago",unread:true,thread:[
    {out:false,text:"Good morning, please I want to know more about the payment plan for Bethel City",time:"9:02 AM"},
  ]},
  {id:"wa2",init:"EO",bg:"#FEF3C7",tc:"#92400E",name:"Emmanuel Okonkwo",time:"15m ago",unread:true,thread:[
    {out:false,text:"Can we schedule the site visit for Saturday morning?",time:"8:48 AM"},
  ]},
  {id:"wa3",init:"NK",bg:"#EDE9FE",tc:"#5B21B6",name:"Ngozi Kamalu",time:"1h ago",unread:false,thread:[
    {out:false,text:"Thank you so much! When will my vendor account be activated?",time:"8:00 AM"},
    {out:true,text:"Hi Ngozi! Your vendor account is now active. You can start listing products right away 🎉",time:"8:05 AM"},
  ]},
  {id:"wa4",init:"FI",bg:"#D1FAE5",tc:"#065F46",name:"Festus Ikenna",time:"2h ago",unread:false,thread:[
    {out:false,text:"What documents do I need to bring for the survey?",time:"7:15 AM"},
  ]},
  {id:"wa5",init:"BO",bg:"#FEE2E2",tc:"#991B1B",name:"Bello Kabiru",time:"3h ago",unread:true,thread:[
    {out:false,text:"Is there any discount if I pay in full?",time:"6:30 AM"},
  ]},
]

export const WA_TEMPLATES = [
  {name:"New lead welcome",body:"Hello [Name]! Thank you for reaching out to Bomach Group. I'm [Agent Name] and I'll be helping you with your enquiry about [Division/Service]. Can I ask — what's most important to you about this?"},
  {name:"Follow-up Day 3",body:"Hi [Name], just checking in! I shared some information about [Service] a few days ago. Have you had a chance to review it? I'm happy to answer questions or arrange a visit at your convenience."},
  {name:"Referral ask (Day 60)",body:"Hello [Name]! We hope you're enjoying your experience with Bomach Group. We'd love to help more people like you — do you know anyone looking to [buy land / build / use Benji]? We offer a generous reward for every successful referral. 🎁"},
  {name:"Site visit confirmation",body:"Hello [Name]! Your site visit is confirmed for [Date] at [Time]. Our team will meet you at [Location]. Please bring a valid ID. Looking forward to seeing you! — Bomach Group"},
  {name:"Proposal sent follow-up",body:"Hi [Name]! I sent across the proposal/pricing details earlier. Please let me know if you have any questions or if you'd like to discuss any aspect. We're here to make this as easy as possible for you."},
]

export const DEFAULT_BROADCASTS = [
  {date:"Jul 10",audience:"All RE leads",sent:310,delivered:298,resp:47,gen:12},
  {date:"Jul 7",audience:"Benji vendors",sent:124,delivered:119,resp:31,gen:8},
  {date:"Jul 3",audience:"Dormant leads",sent:89,delivered:84,resp:12,gen:3},
  {date:"Jun 28",audience:"All RE leads",sent:275,delivered:261,resp:39,gen:9},
]

export const DEFAULT_DESIGN_TASKS: DesignTask[] = [
  {id:"dt1",thumb:"IMG",tbg:"#DBEAFE",ttc:"#1E40AF",title:"Bethel City — Square post graphic",brief:"Content Director",platform:"Instagram",due:"Jul 16",status:"todo"},
  {id:"dt2",thumb:"VID",tbg:"#EDE9FE",ttc:"#5B21B6",title:"Benji vendor onboarding explainer",brief:"Content Director",platform:"TikTok",due:"Jul 15",status:"todo"},
  {id:"dt3",thumb:"GFX",tbg:"#D1FAE5",ttc:"#065F46",title:"Survey services flyer — WhatsApp",brief:"Content Director",platform:"WhatsApp",due:"Jul 17",status:"todo"},
  {id:"dt4",thumb:"OVR",tbg:"#FEE2E2",ttc:"#991B1B",title:"Weekly property drop graphic",brief:"Content Director",platform:"All platforms",due:"Jul 13",status:"todo",overdue:true},
  {id:"dt5",thumb:"REV",tbg:"#FEF3C7",ttc:"#92400E",title:"Engineering project showcase carousel",brief:"Graphic Designer",platform:"Instagram",due:"Jul 15",status:"review"},
  {id:"dt6",thumb:"✓",tbg:"#D1FAE5",ttc:"#065F46",title:"Bethel City estate walkthrough video",brief:"Published Jul 14 · Reach: 4,200 · 87 saves",platform:"Instagram",due:"Jul 14",status:"done"},
  {id:"dt7",thumb:"✓",tbg:"#D1FAE5",ttc:"#065F46",title:'"Survey before you build" carousel',brief:"Published Jul 14 · Reach: 2,100 · 43 shares",platform:"Facebook",due:"Jul 14",status:"done"},
  {id:"dt8",thumb:"✓",tbg:"#D1FAE5",ttc:"#065F46",title:"Benji vendor spotlight — Mama Oby's Kitchen",brief:"Published Jul 13 · Reach: 3,800",platform:"Instagram + TikTok",due:"Jul 13",status:"done"},
]

export const TEAM_DIRECTORY: TeamMemberInfo[] = [
  {name:"Engr. Tochukwu David",role:"CEO & Founder",init:"TD",bg:"#CC0000",status:"online",phone:"09018000118",stat:"Oversees all divisions"},
  {name:"Peace Chukwuwike",role:"Acting Marketing Coordinator",init:"PC",bg:"#1F3D7A",status:"online",phone:"08031112222",stat:"88% KPI compliance"},
  {name:"Emeka Obi",role:"Sales Representative",init:"EO",bg:"#0A6B3E",status:"online",phone:"08033334444",stat:"92% — top performer"},
  {name:"Chioma Sale",role:"Sales Representative",init:"CS",bg:"#0A6B3E",status:"away",phone:"08035556666",stat:"72% — on track"},
  {name:"Williams Favor",role:"Videographer / Content Director",init:"WF",bg:"#CC0000",status:"online",phone:"08037778888",stat:"78% — close to target"},
  {name:"Content Creator",role:"Content Creator",init:"CC",bg:"#7C3AED",status:"online",phone:"08039990000",stat:"5 items delivered this week"},
  {name:"Digital Marketer",role:"Digital Marketing Specialist",init:"DM",bg:"#B87D00",status:"online",phone:"08031234000",stat:"85% — ad performance strong"},
  {name:"Graphic Designer",role:"Creative / Graphic Designer",init:"GD",bg:"#7C3AED",status:"offline",phone:"08035671234",stat:"65% — needs attention"},
  {name:"Customer Care Officer",role:"Customer Support",init:"CO",bg:"#0A6B3E",status:"online",phone:"08039871234",stat:"95% response rate"},
  {name:"Business Developer",role:"Business Development",init:"BD",bg:"#1F3D7A",status:"away",phone:"08032221111",stat:"70% — partner outreach"},
  {name:"Partner Manager",role:"Partnerships & Media",init:"PM",bg:"#B87D00",status:"online",phone:"08034445555",stat:"7 active realtor partners"},
  {name:"Analytics Officer",role:"Analytics & Insights",init:"AN",bg:"#6B7280",status:"offline",phone:"08036667777",stat:"Weekly reports on schedule"},
]

export const MEDIA_ITEMS: MediaItem[] = [
  {title:"Bethel City Drone Footage",type:"video",bg:"#1F3D7A",icon:"ti-video",div:"re",size:"240 MB"},
  {title:"Estate Logo Pack",type:"image",bg:"#0A6B3E",icon:"ti-photo",div:"re",size:"12 MB"},
  {title:"Benji App Screenshots",type:"image",bg:"#7C3AED",icon:"ti-device-mobile",div:"ben",size:"8 MB"},
  {title:"Engineering Showcase Reel",type:"video",bg:"#CC0000",icon:"ti-video",div:"eng",size:"180 MB"},
  {title:"Brand Guideline PDF",type:"doc",bg:"#B87D00",icon:"ti-file-text",div:"re",size:"4 MB"},
  {title:"Survey Site Photos",type:"image",bg:"#059669",icon:"ti-photo",div:"sur",size:"56 MB"},
  {title:"Vendor Testimonial Clips",type:"video",bg:"#7C3AED",icon:"ti-video",div:"ben",size:"310 MB"},
  {title:"Farm Produce Photos",type:"image",bg:"#DC2626",icon:"ti-photo",div:"agr",size:"22 MB"},
]

export const DEFAULT_NOTIFS: Notification[] = [
  {icon:"ti-alert-triangle",bg:"#FEE2E2",col:"#DC2626",txt:"5 leads overdue for follow-up — oldest is 3 days",time:"5 min ago",read:false},
  {icon:"ti-photo",bg:"#FEF3C7",col:"#D97706",txt:"Content 3 pieces behind weekly target",time:"1 hour ago",read:false},
  {icon:"ti-check",bg:"#D1FAE5",col:"#059669",txt:"Deal won — Ngozi Kamalu closed ₦3.5M",time:"2 hours ago",read:false},
  {icon:"ti-users",bg:"#DBEAFE",col:"#1E40AF",txt:"3 influencer proposals pending your approval",time:"3 hours ago",read:false},
  {icon:"ti-headset",bg:"#FCE7F3",col:"#9D174D",txt:"Urgent support ticket opened — Benji vendor issue",time:"Yesterday",read:true},
]

export const PERIODS: Periods = {
  today:{leads:"23",conv:"21.4%",pipe:"₦12M",content:"4",al:"83",ar:"₦8.2M"},
  week:{leads:"127",conv:"18.2%",pipe:"₦84M",content:"17",al:"483",ar:"₦47.3M"},
  month:{leads:"483",conv:"15.8%",pipe:"₦210M",content:"68",al:"1,420",ar:"₦142M"},
  quarter:{leads:"1,420",conv:"14.2%",pipe:"₦580M",content:"186",al:"4,100",ar:"₦389M"},
}

export const ROLES: Roles = {
  ceo:{n:"Engr. Tochukwu",i:"TD",r:"CEO & Founder",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-address-book",l:"Lead 360 journal",s:"lead-journal",b:"5",bt:"red"}]},
    {g:"Revenue execution",items:[{ic:"ti-command",l:"Revenue command",s:"revenue-command"},{ic:"ti-bolt",l:"Daily execution",s:"daily-execution",b:"6",bt:"red"},{ic:"ti-road",l:"13-week turnaround",s:"turnaround"}]},
    {g:"Overview",items:[{ic:"ti-layout-dashboard",l:"Command centre",s:"dashboard"},{ic:"ti-target",l:"OKRs & targets",s:"okrs"}]},
    {g:"Revenue controls",items:[{ic:"ti-radar-2",l:"Lead control tower",s:"lead-control",b:"5",bt:"red"},{ic:"ti-filter-search",l:"Funnel leak audit",s:"funnel-audit"},{ic:"ti-chart-arrows-vertical",l:"Forecast & coverage",s:"forecast"},{ic:"ti-shield-check",l:"Compliance",s:"compliance"}]},
    {g:"Marketing",items:[{ic:"ti-users",l:"CRM Pipeline",s:"pipeline",b:"5",bt:"red"},{ic:"ti-speakerphone",l:"Campaigns",s:"campaigns"},{ic:"ti-calendar",l:"Content calendar",s:"calendar"},{ic:"ti-photo-video",l:"Media library",s:"media"}]},
    {g:"Operations",items:[{ic:"ti-users-group",l:"Partners & media",s:"partners"},{ic:"ti-chart-bar",l:"Analytics",s:"analytics"},{ic:"ti-headset",l:"Support",s:"support",b:"8",bt:"red"}]},
    {g:"Team",items:[{ic:"ti-address-book",l:"Team directory",s:"team-directory"},{ic:"ti-user-plus",l:"New lead",s:"new-lead"}]},
    {g:"Enablement & growth",items:[{ic:"ti-book-2",l:"Sales playbooks",s:"playbooks"},{ic:"ti-school",l:"Coaching",s:"coaching"},{ic:"ti-layout-kanban",l:"Content revenue studio",s:"content-studio"},{ic:"ti-repeat",l:"Retention & referrals",s:"retention"}]},
    {g:"Commercial operations",items:[{ic:"ti-mail-forward",l:"Email marketing",s:"email-center"},{ic:"ti-ad",l:"Traditional media register",s:"media-register"},{ic:"ti-transfer",l:"Sales handoffs",s:"handoff"},{ic:"ti-user-star",l:"External realtors",s:"realtor-portal"},{ic:"ti-brand-instagram",l:"Partner work portal",s:"partner-portal"}]},
    {g:"Governance",items:[{ic:"ti-lock-access",l:"Role & permissions",s:"role-governance"},{ic:"ti-checkup-list",l:"Approval center",s:"approvals",b:"3",bt:"red"},{ic:"ti-history",l:"Audit log",s:"audit-log"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  mgr:{n:"Marketing Manager",i:"MM",r:"Marketing Manager",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-address-book",l:"Lead 360 journal",s:"lead-journal",b:"5",bt:"red"}]},
    {g:"Revenue execution",items:[{ic:"ti-command",l:"Revenue command",s:"revenue-command"},{ic:"ti-bolt",l:"Daily execution",s:"daily-execution",b:"6",bt:"red"},{ic:"ti-radar-2",l:"Lead control tower",s:"lead-control",b:"5",bt:"red"}]},
    {g:"Overview",items:[{ic:"ti-layout-dashboard",l:"Team dashboard",s:"dashboard"},{ic:"ti-target",l:"OKRs & targets",s:"okrs"}]},
    {g:"Leads & Sales",items:[{ic:"ti-users",l:"Full pipeline",s:"pipeline",b:"5",bt:"red"},{ic:"ti-speakerphone",l:"Campaigns",s:"campaigns"}]},
    {g:"Content & Partners",items:[{ic:"ti-calendar",l:"Content calendar",s:"calendar"},{ic:"ti-photo-video",l:"Media library",s:"media"},{ic:"ti-users-group",l:"Partners & media",s:"partners"}]},
    {g:"Data",items:[{ic:"ti-chart-bar",l:"Analytics",s:"analytics"},{ic:"ti-address-book",l:"Team directory",s:"team-directory"},{ic:"ti-user-plus",l:"New lead",s:"new-lead"}]},
    {g:"Performance system",items:[{ic:"ti-filter-search",l:"Funnel audit",s:"funnel-audit"},{ic:"ti-book-2",l:"Sales playbooks",s:"playbooks"},{ic:"ti-school",l:"Coaching",s:"coaching"},{ic:"ti-chart-arrows-vertical",l:"Forecast",s:"forecast"},{ic:"ti-road",l:"Turnaround plan",s:"turnaround"}]},
    {g:"Extended operations",items:[{ic:"ti-mail-forward",l:"Email marketing",s:"email-center"},{ic:"ti-ad",l:"Traditional media",s:"media-register"},{ic:"ti-transfer",l:"Sales handoffs",s:"handoff"},{ic:"ti-user-star",l:"External realtors",s:"realtor-portal"},{ic:"ti-brand-instagram",l:"Partner portal",s:"partner-portal"},{ic:"ti-checkup-list",l:"Approvals",s:"approvals"},{ic:"ti-history",l:"Activity log",s:"audit-log"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  coord:{n:"Peace Chukwuwike",i:"PC",r:"Acting Coordinator",nav:[
    {g:"Revenue execution",items:[{ic:"ti-bolt",l:"Daily execution",s:"daily-execution",b:"6",bt:"red"},{ic:"ti-radar-2",l:"Lead control",s:"lead-control"},{ic:"ti-filter-search",l:"Funnel audit",s:"funnel-audit"}]},
    {g:"Team",items:[{ic:"ti-layout-dashboard",l:"Team overview",s:"dashboard"},{ic:"ti-users",l:"Pipeline",s:"pipeline",b:"5",bt:"red"}]},
    {g:"Content",items:[{ic:"ti-calendar",l:"Content calendar",s:"calendar"},{ic:"ti-brand-whatsapp",l:"WhatsApp",s:"whatsapp",b:"5",bt:"blue"}]},
    {g:"Actions",items:[{ic:"ti-chart-bar",l:"Analytics",s:"analytics"},{ic:"ti-address-book",l:"Team directory",s:"team-directory"},{ic:"ti-user-plus",l:"New lead",s:"new-lead"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  bizdev:{n:"Business Developer",i:"BD",r:"Business Developer",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-user-star",l:"External realtors",s:"realtor-portal"},{ic:"ti-brand-instagram",l:"Partner portal",s:"partner-portal"},{ic:"ti-ad",l:"Traditional media",s:"media-register"}]},
    {g:"Revenue execution",items:[{ic:"ti-bolt",l:"Daily execution",s:"daily-execution"},{ic:"ti-book-2",l:"Sales playbooks",s:"playbooks"},{ic:"ti-repeat",l:"Retention & referrals",s:"retention"}]},
    {g:"My work",items:[{ic:"ti-layout-dashboard",l:"My dashboard",s:"dashboard"},{ic:"ti-users",l:"My leads",s:"pipeline"},{ic:"ti-users-group",l:"Partners",s:"partners"}]},
    {g:"Actions",items:[{ic:"ti-user-plus",l:"New lead",s:"new-lead"},{ic:"ti-brand-whatsapp",l:"WhatsApp",s:"whatsapp"},{ic:"ti-address-book",l:"Team directory",s:"team-directory"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  digital:{n:"Digital Marketer",i:"DM",r:"Digital Marketer",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-mail-forward",l:"Email marketing",s:"email-center"},{ic:"ti-ad",l:"Traditional media",s:"media-register"}]},
    {g:"Revenue execution",items:[{ic:"ti-layout-kanban",l:"Content revenue studio",s:"content-studio"},{ic:"ti-filter-search",l:"Funnel audit",s:"funnel-audit"},{ic:"ti-shield-check",l:"Campaign compliance",s:"compliance"}]},
    {g:"My work",items:[{ic:"ti-speakerphone",l:"My campaigns",s:"campaigns"},{ic:"ti-chart-bar",l:"Ad analytics",s:"analytics"},{ic:"ti-calendar",l:"Content calendar",s:"calendar"},{ic:"ti-photo-video",l:"Media library",s:"media"}]},
    {g:"Actions",items:[{ic:"ti-user-plus",l:"Register lead",s:"new-lead"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  content:{n:"Content Director",i:"CD",r:"Content Director",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-address-book",l:"Lead activity insight",s:"lead-journal"}]},
    {g:"Revenue execution",items:[{ic:"ti-layout-kanban",l:"Content revenue studio",s:"content-studio"},{ic:"ti-filter-search",l:"Funnel impact",s:"funnel-audit"}]},
    {g:"My work",items:[{ic:"ti-calendar",l:"Content calendar",s:"calendar"},{ic:"ti-palette",l:"Design board",s:"design"},{ic:"ti-photo-video",l:"Media library",s:"media"},{ic:"ti-chart-bar",l:"Content analytics",s:"analytics"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  creator:{n:"Content Creator",i:"CC",r:"Content Creator",nav:[
    {g:"Revenue execution",items:[{ic:"ti-layout-kanban",l:"Content revenue studio",s:"content-studio"}]},
    {g:"My tasks",items:[{ic:"ti-calendar",l:"My content tasks",s:"calendar"},{ic:"ti-palette",l:"Design board",s:"design"},{ic:"ti-photo-video",l:"Media library",s:"media"}]},
  ]},
  graphic:{n:"Graphic Designer",i:"GD",r:"Graphic Designer",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"}]},
    {g:"Revenue execution",items:[{ic:"ti-layout-kanban",l:"Content revenue studio",s:"content-studio"}]},
    {g:"My tasks",items:[{ic:"ti-palette",l:"Design task board",s:"design"},{ic:"ti-calendar",l:"Content calendar",s:"calendar"},{ic:"ti-photo-video",l:"Media library",s:"media"}]},
  ]},
  sales:{n:"Sales Rep",i:"SR",r:"Sales Representative",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-address-book",l:"Lead 360 journal",s:"lead-journal",b:"5",bt:"red"},{ic:"ti-transfer",l:"Documentation handoffs",s:"handoff"},{ic:"ti-user-star",l:"Realtor network",s:"realtor-portal"}]},
    {g:"Revenue execution",items:[{ic:"ti-bolt",l:"My daily execution",s:"daily-execution"},{ic:"ti-radar-2",l:"Lead control",s:"lead-control"},{ic:"ti-book-2",l:"Sales playbooks",s:"playbooks"},{ic:"ti-school",l:"Coaching",s:"coaching"}]},
    {g:"My leads",items:[{ic:"ti-users",l:"My pipeline",s:"pipeline"},{ic:"ti-user-plus",l:"Register lead",s:"new-lead"}]},
    {g:"Comms",items:[{ic:"ti-brand-whatsapp",l:"WhatsApp",s:"whatsapp"},{ic:"ti-calendar",l:"Content calendar",s:"calendar"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  care:{n:"Customer Care",i:"CO",r:"Customer Care Officer",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-address-book",l:"Lead 360 journal",s:"lead-journal"},{ic:"ti-transfer",l:"Onboarding handoffs",s:"handoff"},{ic:"ti-mail-forward",l:"Customer emails",s:"email-center"}]},
    {g:"Revenue execution",items:[{ic:"ti-bolt",l:"Inquiry execution",s:"daily-execution"},{ic:"ti-radar-2",l:"Lead SLA control",s:"lead-control"},{ic:"ti-repeat",l:"Retention & referrals",s:"retention"}]},
    {g:"Support",items:[{ic:"ti-headset",l:"Support queue",s:"support",b:"8",bt:"red"},{ic:"ti-brand-whatsapp",l:"WhatsApp inbox",s:"whatsapp",b:"5",bt:"blue"}]},
    {g:"Leads",items:[{ic:"ti-users",l:"Client leads",s:"pipeline"},{ic:"ti-chart-bar",l:"My stats",s:"analytics"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  partner:{n:"Partner Manager",i:"PM",r:"Partner Manager",nav:[
    {g:"Integrated work",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-user-star",l:"Realtor management",s:"realtor-portal"},{ic:"ti-brand-instagram",l:"Partner work portal",s:"partner-portal"},{ic:"ti-checkup-list",l:"Partner approvals",s:"approvals"}]},
    {g:"Revenue execution",items:[{ic:"ti-repeat",l:"Retention & referrals",s:"retention"},{ic:"ti-book-2",l:"Partner playbooks",s:"playbooks"}]},
    {g:"Partners",items:[{ic:"ti-users-group",l:"All partners",s:"partners"},{ic:"ti-users",l:"Partner leads",s:"pipeline"}]},
    {g:"Data",items:[{ic:"ti-chart-bar",l:"Partner analytics",s:"analytics"},{ic:"ti-address-book",l:"Team directory",s:"team-directory"}]},
  ]},
  analyst:{n:"Analytics Officer",i:"AN",r:"Analytics Officer",nav:[
    {g:"Revenue execution",items:[{ic:"ti-command",l:"Revenue command",s:"revenue-command"},{ic:"ti-filter-search",l:"Funnel audit",s:"funnel-audit"},{ic:"ti-chart-arrows-vertical",l:"Forecast",s:"forecast"}]},
    {g:"Analytics",items:[{ic:"ti-chart-bar",l:"Full analytics",s:"analytics"},{ic:"ti-target",l:"OKRs",s:"okrs"}]},
    {g:"Data",items:[{ic:"ti-speakerphone",l:"Campaign data",s:"campaigns"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Marketing meetings",s:"marketing-meetings"}]},
  ]},
  realtor:{n:"External Realtor",i:"ER",r:"External Realtor",nav:[
    {g:"My portal",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-user-star",l:"Realtor portal",s:"realtor-portal"},{ic:"ti-address-book",l:"My referred leads",s:"lead-journal"}]},
  ]},
  influencer:{n:"External Partner",i:"EP",r:"External Partner / Influencer",nav:[
    {g:"My portal",items:[{ic:"ti-device-desktop",l:"My work desk",s:"workdesk"},{ic:"ti-brand-instagram",l:"Assigned tasks & reports",s:"partner-portal"}]},
    {g:"Campaign Operations",items:[{ic:"ti-calendar-event",l:"Campaign meetings",s:"marketing-meetings"}]},
  ]},
}

export const FIVE_UNITS = [
  ['Unit 1','Business Development & Market Intelligence','Market intelligence, opportunities, strategy, partnerships and control'],
  ['Unit 2','Digital Marketing & Social','Paid media, funnels, landing pages, tracking, email and automation'],
  ['Unit 3','Content, Media & Creative','Strategy, scripts, production, design, publishing and asset intelligence'],
  ['Unit 4','Sales & Traditional Marketing','Prospecting, field marketing, realtor network, inspections, negotiation and closing'],
  ['Unit 5','Customer Relations & Retention','Inquiry response, complaints, onboarding, referrals, loyalty and reactivation'],
]

export const ROLE_ROUTINES: Record<string, { name: string; morning: string[]; afternoon: string[]; close: string[] }> = {
  ceo:{name:'CEO & Founder',morning:['Review revenue command centre','Review critical risks and approvals','Check branch and unit performance','Review major opportunities'],afternoon:['Remove cross-department blockers','Approve strategic spend and partnerships','Review top 10 deals','Coach department heads'],close:['Review department summaries','Confirm executive decisions','Set tomorrow priorities']},
  mgr:{name:'Marketing Manager',morning:['Monitor market trends','Track competitors','Review dashboards and revenue vs target','Check pricing and campaign compliance','Validate lead and campaign data'],afternoon:['Evaluate campaigns','Review performance metrics','Identify business opportunities','Research partnerships','Update opportunity pipeline','Assign optimisations'],close:['Review reports','Document insights','Prepare briefs','Review alignment','Flag risks to CEO']},
  bizdev:{name:'Business Development',morning:['Review market intelligence queue','Research competitor offers','Identify partnership targets','Review opportunity pipeline','Prepare outreach list'],afternoon:['Conduct partnership outreach','Evaluate opportunity feasibility','Prepare business case','Update partner CRM','Coordinate proposals'],close:['Document findings','Submit opportunity report','Set next actions']},
  digital:{name:'Digital Marketer',morning:['Check Meta, Google and TikTok campaigns','Review funnels and landing pages','Check new digital leads','Validate UTM and conversion tracking','Review email and WhatsApp automation'],afternoon:['Optimise paid ads','Run A/B tests','Post approved content','Reply comments and DMs','Target inactive and repeat users','Coordinate creatives'],close:['Log campaign data','Update deal sources','Submit optimisation notes','Schedule next-day campaigns']},
  content:{name:'Content & Media Director',morning:['Review ongoing productions','Trend research','Align content calendar','Approve scripts and storyboards','Confirm cast, location and equipment'],afternoon:['Direct production','Review edits and designs','Route content for approval','Coordinate publishing handoff','Brief digital marketing'],close:['Approve final outputs','Review content performance','Organise and archive assets','Update production board']},
  graphic:{name:'Creative Designer',morning:['Review design queue','Confirm brand and format requirements','Prepare campaign assets','Check source files and templates'],afternoon:['Design and revise assets','Create motion graphics','Optimise platform sizes','Submit designs for review'],close:['Archive source files','Update task status','Record revisions and delivery']},
  sales:{name:'Sales Representative',morning:['Prospect new clients','Follow up assigned leads','Escalate hot leads','Handle inquiries','Present approved offers','Upsell and cross-sell'],afternoon:['Prepare quotations','Conduct inspections / field visits','Negotiate deals','Confirm payments','Close sales','Coordinate documentation'],close:['Update CRM','Set next action for every active lead','Track personal performance','Submit daily sales report','Maintain client relationships']},
  care:{name:'Customer Relations Officer',morning:['Reply calls, WhatsApp, email and social inquiries','Log complaints and requests','Send welcome and service messages','Check documentation reminders','Verify service delivery'],afternoon:['Coordinate complaint resolution','Run satisfaction surveys','Reactivate dormant users','Follow up after resolution','Coordinate referrals','Escalate unresolved cases'],close:['Review conversation quality','Tag issue categories','Update FAQ knowledge base','Monitor negative feedback','Submit support report']},
  partner:{name:'Partner Manager',morning:['Review realtor and influencer tasks','Check partner-generated leads','Verify submitted reports','Review commission and payment queue'],afternoon:['Assign partner tasks','Review performance evidence','Recruit and onboard partners','Coordinate partner campaigns'],close:['Update partner scorecards','Submit approval requests','Log partner risks']},
  realtor:{name:'External Realtor',morning:['Review assigned estates and offers','Prospect qualified buyers','Register every referred lead','Schedule inspections'],afternoon:['Follow up referred prospects','Attend inspections','Submit buyer feedback','Request approved materials'],close:['Update lead status','Submit activity report','Confirm next actions']},
  influencer:{name:'External Partner / Influencer',morning:['Review assigned brief','Confirm deliverables and due date','Prepare content concept'],afternoon:['Produce and publish approved content','Engage audience','Use assigned tracking link'],close:['Submit proof and analytics','Report audience feedback','Flag blockers']},
}

export const ROLE_OBLIGATIONS: Record<string, string[]> = {
  ceo:['Approve strategic campaigns and expenditure','Review weekly executive dashboard','Remove critical blockers'],
  mgr:['Own department revenue and pipeline','Approve campaigns and content','Submit daily/weekly/monthly reports'],
  digital:['Maintain tracking accuracy','Optimise spend daily','Report CPL, CTR, ROAS and lead quality'],
  content:['Meet content calendar','Maintain brand and approval quality','Archive all content assets'],
  graphic:['Deliver approved designs on time','Maintain brand consistency','Store editable source files'],
  sales:['No lead without follow-up and next action','Update CRM before close of day','Meet revenue and conversion targets'],
  care:['First response within SLA','Log every conversation and complaint','Follow through to resolution'],
  bizdev:['Produce actionable market intelligence','Maintain opportunity pipeline','Develop qualified partnerships'],
  partner:['Verify partner performance before payment','Maintain agreements and KYC','Track partner-sourced revenue'],
  realtor:['Register leads before inspection','Use only approved information','Maintain client confidentiality'],
  influencer:['Follow approved brief','Disclose partnership where required','Submit proof and performance report'],
}

export const C4_STEPS = ['Campaign brief','Audience & offer','Channels & budget','Funnel & tracking','Content & activation','Team & governance','KPIs & rules','Risk & readiness']

export const C4_CHANNELS = ['Meta Ads','Google Ads','TikTok Ads','LinkedIn Ads','Email','WhatsApp','SMS','SEO / Website','Influencers','External Realtors','Billboard','Radio','Television','Print','Field Activation','Events','PR','Push Notification']

export const C4_READINESS = [
  'Campaign brief approved','Budget approved','Audience and offer validated','Landing page or destination ready',
  'Lead form and consent tested','Tracking, UTM and conversion events tested','Creatives approved','Sales and CSRC briefing completed',
  'Lead assignment and SLA configured','Partners, vendors and media booked','Risk and compliance review completed','Launch and reporting schedule confirmed',
]

export const C4_TEMPLATES = [
  {name:'Real Estate Sales Campaign',icon:'ti-building-estate',type:'Sales / Lead Generation',channels:['Meta Ads','WhatsApp','External Realtors','Site Inspection'],objective:'Generate qualified property leads, inspections and sales.',tasks:['Approve offer and price','Build landing page and lead form','Prepare estate creative pack','Brief sales and CSRC','Launch ads and realtor push','Run inspection conversion review']},
  {name:'Brand Awareness Campaign',icon:'ti-broadcast',type:'Brand Awareness',channels:['Radio','Billboard','Social Media','PR'],objective:'Increase awareness, recall, reach and share of voice.',tasks:['Define audience and message','Approve media plan','Create master campaign idea','Book placements','Launch and monitor reach','Run brand-lift review']},
  {name:'Product / Service Launch',icon:'ti-rocket',type:'Product Launch',channels:['Content','Email','Influencers','Events'],objective:'Launch a new product or service with coordinated cross-channel activation.',tasks:['Market research','Value proposition','Launch assets','Partner briefing','Launch event','Post-launch analysis']},
  {name:'Customer Retention Campaign',icon:'ti-heart-handshake',type:'Retention',channels:['Email','WhatsApp','SMS','Customer Care'],objective:'Reactivate dormant customers, increase repeat business and referrals.',tasks:['Create segment','Design offer','Prepare sequence','Train customer care','Launch','Measure repeat purchase and referrals']},
  {name:'Benji Growth Campaign',icon:'ti-truck-delivery',type:'Acquisition',channels:['TikTok Ads','Meta Ads','Push Notification','Vendor Collaboration'],objective:'Grow customers, vendors, riders, app installs and completed orders.',tasks:['Choose growth segment','Create offer','Build app funnel','Set tracking','Launch partner content','Review installs-to-order conversion']},
  {name:'Offline Activation Campaign',icon:'ti-tent',type:'Field Activation',channels:['Field Activation','Radio','Print','External Realtors'],objective:'Generate awareness and leads through physical activations and local media.',tasks:['Select locations','Secure permits','Assign field team','Print materials','Create lead capture process','Reconcile leads and costs']},
]

export const REV_DEFAULT = {
  dailyTasks:[
    {id:'d1',title:'Contact every new and overdue lead',meta:'CSRC + Sales - acknowledgement immediately, human follow-up within internal SLA',severity:'critical',done:false},
    {id:'d2',title:'Put a dated next action on every active opportunity',meta:'Sales team - no active lead may end the day without an owner and next step',severity:'critical',done:false},
    {id:'d3',title:'Review top 10 opportunities and unblock decisions',meta:'Marketing Manager + Sales Lead - focus on high-value, high-intent opportunities',severity:'warning',done:false},
    {id:'d4',title:'Publish one intent-stage proof asset',meta:'Content team - testimonial, inspection proof, title proof, project progress or ROI case',severity:'warning',done:false},
    {id:'d5',title:'Complete one call review and role-play',meta:'Manager - coach one observable skill, not general motivation',severity:'success',done:false},
    {id:'d6',title:'Close the day with numbers, blockers and commitments',meta:'All unit heads - 5 PM revenue close-out',severity:'success',done:false}
  ],
  leakActions:[
    {id:'l1',title:'Enforce 15-minute human-response target for paid leads',owner:'CSRC Lead',due:'Today',done:false},
    {id:'l2',title:'Require qualification fields before sales handoff',owner:'Marketing Manager',due:'16 Jul',done:false},
    {id:'l3',title:'Create inspection/proposal follow-up cadence',owner:'Sales Lead',due:'17 Jul',done:false},
    {id:'l4',title:'Build proof content for evaluation and intent stages',owner:'Content Director',due:'20 Jul',done:false}
  ],
  recovery:[
    {id:'r1',phase:'stabilise',title:'Clean CRM: owners, stages, sources, values and next actions',owner:'Analytics + Sales',week:'Week 1',done:false},
    {id:'r2',phase:'stabilise',title:'Launch lead-response SLA dashboard and escalation',owner:'CSRC Lead',week:'Week 1',done:false},
    {id:'r3',phase:'stabilise',title:'Define MQL, SQL, opportunity, won and lost criteria',owner:'Marketing Manager',week:'Week 2',done:false},
    {id:'r4',phase:'stabilise',title:'Stop campaigns with no traceable leads or revenue signal',owner:'Digital Marketer',week:'Week 2',done:false},
    {id:'r5',phase:'standardise',title:'Roll out division-specific discovery and objection playbooks',owner:'Sales Lead',week:'Week 3',done:false},
    {id:'r6',phase:'standardise',title:'Introduce 7-touch follow-up cadence with next-action automation',owner:'CRM Admin',week:'Week 3–4',done:false},
    {id:'r7',phase:'standardise',title:'Start weekly call review, role-play and coaching scorecard',owner:'Marketing Manager',week:'Week 4',done:false},
    {id:'r8',phase:'standardise',title:'Link every content brief to funnel stage and CTA',owner:'Content Director',week:'Week 5',done:false},
    {id:'r9',phase:'standardise',title:'Implement multi-touch campaign attribution and cost controls',owner:'Analytics Officer',week:'Week 6',done:false},
    {id:'r10',phase:'scale',title:'Scale top two channels and stop bottom-quartile spend',owner:'CEO + Digital',week:'Week 7–8',done:false},
    {id:'r11',phase:'scale',title:'Launch referral, loyalty and dormant-lead reactivation engine',owner:'CSRC + Partnerships',week:'Week 8–9',done:false},
    {id:'r12',phase:'scale',title:'Automate reports, reminders, summaries and approvals',owner:'Bomach OS Team',week:'Week 10',done:false},
    {id:'r13',phase:'scale',title:'Quarterly performance review, role reset and incentive calibration',owner:'CEO + HR',week:'Week 13',done:false}
  ],
  coaching:[
    {id:'c1',rep:'Emeka Obi',focus:'Discovery depth and multi-threading',date:'Tue 14 Jul · 10:00',done:false},
    {id:'c2',rep:'Chioma Sale',focus:'Objection handling and confident close',date:'Wed 15 Jul · 2:00',done:false},
    {id:'c3',rep:'Business Developer',focus:'Account planning and partner pitch',date:'Thu 16 Jul · 11:00',done:false},
    {id:'c4',rep:'CSRC Officer',focus:'Fast qualification and clean handoff',date:'Fri 17 Jul · 9:30',done:false}
  ],
  content:[
    {id:'s1',title:'Why inspect land before payment?',stage:'ideas',owner:'Content Director',funnel:'Discovery',cta:'Book inspection',leads:0,revenue:0},
    {id:'s2',title:'Fortress City client testimonial',stage:'brief',owner:'Videographer',funnel:'Evaluation',cta:'Request price list',leads:0,revenue:0},
    {id:'s3',title:'Engineering project progress reel',stage:'production',owner:'Videographer',funnel:'Evaluation',cta:'Book site assessment',leads:4,revenue:0},
    {id:'s4',title:'Title documentation explainer',stage:'review',owner:'Graphic Designer',funnel:'Intent',cta:'Speak to surveyor',leads:8,revenue:350000},
    {id:'s5',title:'Enugu investment video',stage:'published',owner:'Digital Marketer',funnel:'Awareness',cta:'Join WhatsApp list',leads:46,revenue:4500000},
    {id:'s6',title:'Buyer payment-plan case study',stage:'published',owner:'Content Director',funnel:'Intent',cta:'Request proposal',leads:22,revenue:12000000}
  ],
  compliance:[
    {id:'p1',group:'privacy',title:'Record explicit direct-marketing consent and source',meta:'Form, WhatsApp opt-in, event form or signed document',on:false},
    {id:'p2',group:'privacy',title:'Provide clear opt-out / withdrawal mechanism',meta:'STOP, unsubscribe or preference-centre process',on:false},
    {id:'p3',group:'privacy',title:'Restrict campaigns to permitted channels and purposes',meta:'Email, SMS, call and WhatsApp permissions stored separately',on:false},
    {id:'p4',group:'privacy',title:'Keep privacy notice version and consent timestamp',meta:'Auditable record retained with the lead',on:true},
    {id:'a1',group:'ads',title:'Verify claims, prices, titles and availability before publishing',meta:'Evidence attached to the creative approval record',on:false},
    {id:'a2',group:'ads',title:'Obtain required ARCON vetting / approval before exposure',meta:'Certificate or reference attached to media order where applicable',on:false},
    {id:'a3',group:'ads',title:'Disclose sponsored influencer relationships',meta:'Clear and prominent disclosure in the content',on:true},
    {id:'a4',group:'ads',title:'Archive final approved creative and approval history',meta:'Version control prevents unapproved edits after sign-off',on:true}
  ],
  complianceRegister:[
    {campaign:'Fortress City July Campaign',owner:'Digital Marketer',consent:'Pass',claims:'Pending',arcon:'Pending',status:'Hold'},
    {campaign:'Benji Vendor Activation',owner:'Business Developer',consent:'Pass',claims:'Pass',arcon:'N/A',status:'Ready'},
    {campaign:'Survey Before You Build',owner:'Content Director',consent:'N/A',claims:'Pass',arcon:'Review',status:'Review'}
  ]
}

export const SKILLS = [
  ['Emeka Obi',82,76,88,79,74],['Chioma Sale',67,61,72,64,70],['Business Developer',78,69,62,81,73],['CSRC Officer',85,90,76,70,68]
]

export const PERFORMANCE_CONTRACTS = [
  ['Marketing Manager','Qualified pipeline, conversion, revenue forecast, ROI','Weekly forecast accuracy ≥80%; zero unowned red actions'],
  ['CSRC','Response speed, qualification quality, handoff completeness','95% within SLA; 100% required fields before handoff'],
  ['Sales Representative','Quality conversations, meetings, proposals, wins, revenue','100% active leads with next action; weekly coaching participation'],
  ['Digital Marketer','Qualified leads, cost per qualified lead, influenced pipeline','No channel scaled without source and conversion evidence'],
  ['Content & Media','On-time content, funnel coverage, leads/revenue influenced','At least 40% of output supports evaluation, intent or loyalty'],
  ['Business Development','Target accounts, partner pipeline, meetings, revenue','Named-account plan and partner-sourced opportunity target']
]

export const EVIDENCE = [
  {src:'Salesforce · State of Sales 2026',title:'Automate non-selling work',copy:'Sales teams report that a large share of rep time is consumed by administration, data entry and prospecting. Bomach OS should automate summaries, assignments, reminders and approvals.',url:'https://www.salesforce.com/sales/state-of-sales/'},
  {src:'Harvard Business Review',title:'Speed-to-lead matters',copy:'The research on online leads found that faster response is strongly associated with a much greater chance of qualification. The OS therefore makes response time visible and escalates breaches.',url:'https://hbr.org/2011/03/the-short-life-of-online-sales-leads'},
  {src:'HubSpot Knowledge Base',title:'Separate lifecycle, status and deal stages',copy:'Lifecycle stage describes the relationship; lead status tracks qualification activity; deal stages track active opportunities. Keeping them separate improves handoff and reporting.',url:'https://knowledge.hubspot.com/records/use-lifecycle-stages'},
  {src:'HubSpot Playbooks',title:'Standardise conversations and notes',copy:'Interactive playbooks help teams use consistent questions and structured notes during customer conversations.',url:'https://knowledge.hubspot.com/playbooks/use-playbooks'},
  {src:'Google Analytics',title:'Use attribution paths',copy:'Attribution assigns conversion credit across touchpoints. Bomach should retain first touch, lead source, campaign, assisted touchpoints and closing source.',url:'https://support.google.com/analytics/answer/10596866'},
  {src:'WhatsApp Business',title:'Build permission-based conversational commerce',copy:'Use click-to-WhatsApp, rapid response, useful templates, segmentation and opt-out controls rather than indiscriminate broadcasts.',url:'https://whatsappbusiness.com/products/create-ads-that-click-to-whatsapp/'},
  {src:'DataReportal · Digital 2026 Nigeria',title:'Operate mobile-first',copy:'Nigeria had tens of millions of active social-media user identities at the end of 2025, reinforcing the need for mobile-first creative, messaging and measurement.',url:'https://datareportal.com/reports/digital-2026-nigeria'},
  {src:'NDPC + ARCON',title:'Make compliance part of workflow',copy:'Direct marketing consent, withdrawal/objection, evidence of claims and required advertising approval should be captured before campaigns go live.',url:'https://ndpc.gov.ng/'}
]

export const HANDOFF_STEPS = ['Payment confirmed','Documentation','Allocation / Service Order','Operations delivery','Customer onboarding']

export const FRAMEWORK_COMPONENTS = ['Mission / Purpose','Job Description','Responsibilities','Authority Limits','Reporting Structure','Permissions Matrix','SOPs','Task Templates','Daily Routine','Reports','Targets','KPIs','Training Requirements','Performance History','Career Path','Resources & Tools','Success Playbook','OKRs','Competencies','Risk & Compliance','Decision Matrix','Succession Plan','Stakeholder Management','Knowledge Base']

export const GOVERNANCE_ROLES = ['Marketing Manager','Business Development Officer','Digital Marketer','Content & Media Director','Creative Designer','Sales Representative','Customer Relations Officer','Partner Manager']

export const MODULES = ['Revenue Dashboard','Lead 360 CRM','Sales Pipeline','Campaigns & Ads','Email & WhatsApp','Content Studio','Traditional Media','Realtors & Partners','Documentation Handoff','Reports & Exports','Approvals','Role Governance']

export const PERM_ACTIONS = ['View','Create','Edit','Approve','Assign','Export','Delete']

export const INTEGRATIONS = [
  {name:'Meta Lead Ads',icon:'ti-brand-facebook',status:'Connected',detail:'Webhook + leads_retrieval + lead ID',bg:'#DBEAFE',col:'#1E40AF'},
  {name:'WhatsApp Cloud API',icon:'ti-brand-whatsapp',status:'Configuration ready',detail:'Templates, conversation log and opt-in',bg:'#D1FAE5',col:'#065F46'},
  {name:'Email Provider',icon:'ti-mail',status:'DNS required',detail:'SPF, DKIM, DMARC and unsubscribe',bg:'#FEF3C7',col:'#92400E'},
  {name:'Google Ads',icon:'ti-brand-google',status:'Mapping ready',detail:'GCLID + enhanced conversions for leads',bg:'#FCE7F3',col:'#9D174D'},
  {name:'Meta Conversions API',icon:'ti-arrows-exchange',status:'Design ready',detail:'Lead, qualified, inspection and purchase events',bg:'#EDE9FE',col:'#5B21B6'},
  {name:'Google Analytics / GTM',icon:'ti-chart-histogram',status:'Configuration ready',detail:'UTM, events, landing pages and funnels',bg:'#DBEAFE',col:'#1E40AF'},
  {name:'SMS Gateway',icon:'ti-message',status:'Not connected',detail:'Transactional and consent-based messages',bg:'#FEE2E2',col:'#991B1B'},
  {name:'Payment Gateways',icon:'ti-credit-card',status:'Mapping ready',detail:'Paystack / Flutterwave conversion outcome',bg:'#D1FAE5',col:'#065F46'}
]

export const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  estate:{subject:'{{first_name}}, here are the current {{estate}} details',body:'Hello {{first_name}},\n\nThank you for your interest in {{estate}}. Attached are the current price, title information, payment plan and inspection options.\n\nReply to this email or use your assigned WhatsApp link to speak with our team.\n\nBomach Group'},
  inspection:{subject:'Reminder: your property inspection is coming up',body:'Hello {{first_name}},\n\nThis is a reminder for your inspection of {{estate}} on {{inspection_date}}. Your assigned officer will contact you before departure.\n\nPlease reply if you need to reschedule.'},
  payment:{subject:'Payment plan follow-up for {{estate}}',body:'Hello {{first_name}},\n\nFollowing our discussion, here is your approved payment plan and the next payment milestone. Please contact your sales officer if you require clarification.'},
  retention:{subject:'Thank you for choosing Bomach Group',body:'Hello {{first_name}},\n\nWe appreciate your trust. Please share your experience and let us know whether you need any support, documentation update or referral assistance.'},
}

export const STAGE_GUIDE: Record<string, { title: string; objective: string; exit: string }> = {
  discovery:{title:'Discover the real problem',objective:'Understand the customer\'s desired outcome, present situation and decision context before presenting a solution.',exit:'The need, consequences, stakeholders and next conversation are documented.'},
  qualification:{title:'Confirm commercial fit',objective:'Verify need, ability to pay, authority, timing and service fit. Do not promote every inquiry to an opportunity.',exit:'Required qualification fields are complete and a decision event is scheduled.'},
  proposal:{title:'Connect value to the customer\'s decision',objective:'Present a recommendation tied to stated needs, proof, scope, price, risk controls and next step.',exit:'Proposal received, decision process confirmed and follow-up date agreed.'},
  negotiation:{title:'Resolve risk without destroying value',objective:'Separate price objections from trust, cash flow, authority, timing and scope concerns.',exit:'Open issues, decision-maker, concessions and close date are explicit.'},
  closing:{title:'Make the next action easy and specific',objective:'Ask for commitment, confirm documents/payment and remove final operational friction.',exit:'Payment, signature, onboarding or a clear no-decision reason is recorded.'},
  retention:{title:'Deliver, retain and earn advocacy',objective:'Confirm value delivery, resolve friction, request referral and identify the next relevant service.',exit:'Satisfaction recorded; referral/repeat opportunity created or nurture date set.'}
}

export const PLAYBOOKS: Record<string, { name: string; proof: string; questions: string[]; cta: string }> = {
  re:{name:'Real Estate',proof:'Approved survey/title documents, allocation evidence, estate inspection, infrastructure plan, client testimonials and payment receipts',questions:['What are you buying for: home, investment, farming or resale?','Which location and budget range are realistic for you?','Who else must approve the decision?','What must you verify before you can pay?','When would you like to inspect or make the first payment?'],cta:'Book a physical or live-video inspection with a named date and time.'},
  eng:{name:'Engineering & Construction',proof:'Site inspection report, BOQ, programme of works, professional credentials, progress photos, quality-control checklist and contract milestones',questions:['What outcome must the building achieve and by when?','Do you already have drawings, approvals and a BOQ?','What is the material/labour responsibility split?','Who approves variations and payments?','What quality, time or cost failure worries you most?'],cta:'Schedule a technical site assessment and requirements meeting.'},
  sur:{name:'Land Surveying',proof:'Survey plan samples, coordinate verification, beacon evidence, professional seal, title search pathway and delivery checklist',questions:['What is the exact location and land size?','Is this for purchase verification, building, title processing or boundary recovery?','What documents and coordinates are available?','Is there any boundary dispute or encroachment concern?','When is the survey result needed?'],cta:'Book site reconnaissance and document review.'},
  ben:{name:'Benji',proof:'App screenshots, vendor dashboard, order flow, delivery coverage, onboarding checklist, vendor testimonials and service-level information',questions:['Are you joining as vendor, customer, rider or business partner?','What products, order volume and delivery area are involved?','How do you currently receive and fulfil orders?','What is your biggest operational pain?','Who will manage the account daily?'],cta:'Complete onboarding and activate the first product/order workflow.'},
  ict:{name:'ICT / Platforms',proof:'Working prototype, requirements document, architecture, delivery milestones, security controls, training plan and support SLA',questions:['What business process must the system improve?','Who are the users and decision-makers?','What integrations and data already exist?','What is the minimum viable launch outcome?','What budget, deadline and approval process apply?'],cta:'Schedule a paid discovery / requirements workshop.'}
}

export const OPS_DEFAULT = {
  dailyChecks:{},dailyReports:{},
  integrationEvents:[
    {time:'13 Jul 2026 · 10:42',type:'System',action:'Meta Lead Ads webhook test passed',actor:'Digital Marketer'},
    {time:'13 Jul 2026 · 09:18',type:'Lead',action:'Lead L-2247 captured with campaign, ad set, ad and UTM identifiers',actor:'System'},
    {time:'12 Jul 2026 · 16:20',type:'System',action:'WhatsApp template estate_followup_v2 approved for demo',actor:'CRM Admin'}
  ],
  emailCampaigns:[
    {name:'Fortress City inspection invitation',segment:'Qualified real estate leads',sent:284,delivered:276,opened:142,clicked:39,status:'Sent',date:'12 Jul 2026'},
    {name:'Dormant lead reactivation',segment:'Dormant leads (30+ days)',sent:190,delivered:181,opened:76,clicked:18,status:'Sent',date:'8 Jul 2026'},
    {name:'Benji vendor weekly growth tips',segment:'Benji vendors',sent:126,delivered:122,opened:83,clicked:31,status:'Sent',date:'5 Jul 2026'}
  ],
  mediaAssets:[
    {id:'M-001',type:'Billboard',name:'New Haven Junction Billboard',vendor:'Enugu Outdoor Media',location:'New Haven, Enugu',ownership:'Rented',amount:850000,start:'2026-06-20',end:'2026-07-20',status:'Active',proof:'Installation photos'},
    {id:'M-002',type:'Radio',name:'Fortress City Drive-Time Campaign',vendor:'Dream FM 92.5',location:'Morning + evening drive',ownership:'Rented',amount:420000,start:'2026-07-01',end:'2026-07-31',status:'Active',proof:'Broadcast schedule'},
    {id:'M-003',type:'Radio',name:'Benji Vendor Activation Jingle',vendor:'Solid FM 100.9',location:'Enugu metropolis',ownership:'Rented',amount:280000,start:'2026-06-15',end:'2026-07-15',status:'Active',proof:'Jingle + log'},
    {id:'M-004',type:'Branded Vehicle',name:'Bomach Hilux Branding',vendor:'Company Asset',location:'Enugu',ownership:'Company-owned',amount:175000,start:'2026-05-01',end:'2027-05-01',status:'Active',proof:'Asset photos'}
  ],
  realtors:[
    {id:'R-101',name:'Chukwudi Habitat Agency',code:'BOM-REA-101',kyc:'Verified',rate:3,leads:18,sales:14200000,due:126000,paid:300000,status:'Active'},
    {id:'R-102',name:'Nwachukwu Estates Ltd',code:'BOM-REA-102',kyc:'Verified',rate:2.5,leads:11,sales:8700000,due:217500,paid:0,status:'Active'},
    {id:'R-103',name:'Prime Properties Enugu',code:'BOM-REA-103',kyc:'Pending',rate:3,leads:2,sales:0,due:0,paid:0,status:'Pending'},
    {id:'R-104',name:'Greater Horizons Realty',code:'BOM-REA-104',kyc:'Verified',rate:2,leads:7,sales:3100000,due:62000,paid:0,status:'Active'}
  ],
  realtorTasks:[
    {id:'RT-01',realtor:'Chukwudi Habitat Agency',title:'Generate 10 qualified Fortress City prospects',due:'20 Jul 2026',status:'In progress'},
    {id:'RT-02',realtor:'Nwachukwu Estates Ltd',title:'Host one diaspora property webinar',due:'25 Jul 2026',status:'Assigned'},
    {id:'RT-03',realtor:'Greater Horizons Realty',title:'Submit 5 site inspection bookings',due:'18 Jul 2026',status:'In progress'}
  ],
  partnerTasks:[
    {id:'PT-01',partner:'Adaora Okafor',type:'Influencer',title:'Fortress City awareness reel + 3 story frames',objective:'Brand awareness + qualified inquiries',due:'18 Jul 2026',fee:180000,status:'In production',reach:0,leads:0,proof:''},
    {id:'PT-02',partner:'Kelechi Nwosu',type:'Influencer',title:'Benji food delivery challenge',objective:'App installs and first orders',due:'22 Jul 2026',fee:350000,status:'Assigned',reach:0,leads:0,proof:''},
    {id:'PT-03',partner:'Enugu Business Community',type:'Institutional Partner',title:'Property investment webinar promotion',objective:'Inspection bookings',due:'26 Jul 2026',fee:120000,status:'Report submitted',reach:12400,leads:46,proof:'https://example.com/report'}
  ],
  handoffs:[
    {id:'H-001',client:'Adaeze Chukwu',product:'Fortress City Estate · Plot 28',value:4500000,owner:'Emeka Obi',step:1,due:'18 Jul 2026',status:'In progress'},
    {id:'H-002',client:'Ngozi Kamalu',product:'Benji Vendor Activation',value:350000,owner:'Customer Relations',step:4,due:'14 Jul 2026',status:'Onboarding'}
  ],
  permissions:{},
  approvals:[
    {id:'A-01',type:'Campaign',title:'Fortress City Meta campaign — ₦1,000,000',requester:'Digital Marketer',date:'13 Jul 2026',status:'Pending'},
    {id:'A-02',type:'Media',title:'Renew New Haven billboard — ₦850,000',requester:'Marketing Manager',date:'13 Jul 2026',status:'Pending'},
    {id:'A-03',type:'Partner',title:'Influencer payment — Adaora Okafor ₦180,000',requester:'Partner Manager',date:'12 Jul 2026',status:'Pending'},
    {id:'A-04',type:'Content',title:'Engineering project testimonial video',requester:'Content Director',date:'12 Jul 2026',status:'Approved'}
  ],
  audit:[
    {time:'13 Jul 2026 · 11:08',type:'Lead',action:'Follow-up activity added to Adaeze Chukwu',actor:'Emeka Obi'},
    {time:'13 Jul 2026 · 10:42',type:'System',action:'Meta Lead Ads webhook test passed',actor:'Digital Marketer'},
    {time:'13 Jul 2026 · 10:10',type:'Approval',action:'Campaign brief submitted for approval',actor:'Digital Marketer'},
    {time:'13 Jul 2026 · 09:50',type:'Partner',action:'Realtor task assigned to Chukwudi Habitat Agency',actor:'Partner Manager'},
    {time:'13 Jul 2026 · 09:18',type:'Lead',action:'Lead L-2247 created from Facebook Lead Ad',actor:'System'}
  ]
}

export function C4_SEED() {
  const c1 = {
    id:'CMP-2401',name:'Fortress City Diaspora Conversion Campaign',type:'Sales / Lead Generation',brand:'Bomach Group',div:'re',priority:'High',
    objective:'Lead Generation',goal:'Generate qualified diaspora leads and close property sales.',description:'Integrated diaspora campaign using Meta, WhatsApp, email, realtor referrals and virtual inspections.',
    owner:'Digital Marketing Officer',sponsor:'CEO',timezone:'Africa/Lagos',start:'2026-07-01',end:'2026-08-31',status:'Active',
    audience:'Nigerians in the UK, US, Canada and Europe interested in secure Enugu property investment.',locations:'UK, USA, Canada, Germany, Spain, Nigeria',demographics:'Age 28–60; professionals, business owners and families',painPoints:'Trust, documentation, remote inspection, payment security and proof of allocation.',
    product:'Fortress City Estate',funnelStage:'Evaluation → Purchase',offer:'Reserved plots with verified documentation and virtual inspection support.',valueProp:'Own a verified Enugu property through a transparent, trackable purchase process.',cta:'Book Virtual Inspection',destination:'Landing Page + WhatsApp',
    channels:['Meta Ads','Email','WhatsApp','External Realtors','Influencers'],budget:5000000,spent:2180000,revenue:24500000,leads:284,qualified:96,bookings:31,customers:7,
    budgetLines:{media:3000000,creative:500000,partners:700000,offline:300000,tools:200000,contingency:300000},
    landing:'offers.bomachgroup.com/fortress-diaspora',leadForm:'Fortress Diaspora Lead Form',thankYou:'WhatsApp redirect and inspection calendar',whatsapp:'+234 Bomach Sales',sla:'15 minutes',qualificationOwner:'CSRC',handoff:'Qualified and budget-aligned lead → Sales Representative',
    utmSource:'meta',utmMedium:'paid-social',utmCampaign:'fortress_diaspora_2026',utmContent:'creative_variant',tracking:'Meta Pixel + CAPI + GA4',events:['ViewContent','Lead','Contact','Schedule','Purchase'],attribution:'First touch + last touch + closing source',
    keyMessages:'Verified documentation; remote inspection; transparent payment and allocation process.',deliverables:'4 videos, 8 static creatives, 2 email sequences, 4 WhatsApp templates, realtor sales kit, landing page.',offline:'Diaspora association webinars and virtual inspection sessions.',partners:'External realtors and two diaspora community partners.',salesEnablement:'Price sheet, FAQ, objection guide, documentation checklist and virtual inspection script.',assetDue:'2026-06-27',approvers:'Marketing Manager, Legal, CEO',
    daci:{driver:'Marketing Manager',approver:'CEO',contributors:'Digital, Content, Sales, CSRC, Legal',informed:'Finance, Operations'},units:['Business Development','Digital Marketing','Content & Creative','Sales','Customer Relations'],cadence:'Monday and Thursday optimization review',meetingPlatform:'Google Meet',approvalChain:'Content Manager → Marketing Manager → Legal/Finance → CEO',communication:'All decisions in workspace; urgent blockers in group and OS alert.',
    kpis:{reach:500000,leads:450,qualified:150,bookings:60,customers:18,revenue:70000000,cpl:11111,cpa:277778,ctr:2.5,lpcr:12,leadToCustomer:4,roas:14},
    stopRules:'Pause any ad after ₦75,000 spend with zero qualified lead or if CPL is 40% above target for 3 days.',scaleRules:'Increase budget by 20% when ad set sustains target CPL and at least 5 qualified leads over 3 days.',dimensions:'Platform, campaign, ad set, creative, country, estate, lead quality and sales representative.',feedback:'Sales and CSRC rate lead quality within 24 hours and record objections.',
    risks:'Lead fraud, slow response, documentation concerns, currency volatility.',mitigation:'Phone validation, SLA alerts, proof library, approved price validity and finance review.',compliance:['Consent configured','Claims verified','Pricing approved','Privacy notice linked','Brand approval'],
    readiness:['Campaign brief approved','Budget approved','Audience and offer validated','Landing page or destination ready','Lead form and consent tested','Tracking, UTM and conversion events tested','Creatives approved','Sales and CSRC briefing completed','Lead assignment and SLA configured','Partners, vendors and media booked','Risk and compliance review completed','Launch and reporting schedule confirmed'].map((x,i)=>({name:x,done:i<10})),
    tasks:[
      {id:'T-1',title:'Finalise diaspora landing page A/B test',owner:'Digital Marketer',due:'2026-07-15',status:'In Progress',priority:'High'},
      {id:'T-2',title:'Upload current documentation proof pack',owner:'Legal Officer',due:'2026-07-14',status:'To Do',priority:'High'},
      {id:'T-3',title:'Record virtual inspection walkthrough',owner:'Content Director',due:'2026-07-16',status:'Review',priority:'High'},
      {id:'T-4',title:'Brief external realtors on updated offer',owner:'Sales Manager',due:'2026-07-13',status:'Done',priority:'Medium'}
    ],
    metrics:[
      {date:'2026-07-03',spend:420000,reach:69000,clicks:2180,leads:44,qualified:13,bookings:4,customers:1,revenue:3500000,note:'Launch baseline'},
      {date:'2026-07-07',spend:960000,reach:151000,clicks:5080,leads:112,qualified:34,bookings:10,customers:2,revenue:7000000,note:'UK creative strongest'},
      {date:'2026-07-10',spend:1580000,reach:237000,clicks:8120,leads:201,qualified:66,bookings:21,customers:4,revenue:14000000,note:'Added realtor webinar'},
      {date:'2026-07-13',spend:2180000,reach:318000,clicks:11100,leads:284,qualified:96,bookings:31,customers:7,revenue:24500000,note:'Current'}
    ],
    expenses:[{id:'E1',date:'2026-07-01',category:'Paid Media',vendor:'Meta Ads',amount:1800000,status:'Paid'},{id:'E2',date:'2026-07-05',category:'Partner',vendor:'Diaspora Webinar Partner',amount:250000,status:'Approved'},{id:'E3',date:'2026-07-08',category:'Creative',vendor:'Production Team',amount:130000,status:'Paid'}],
    assets:[{id:'A1',name:'Diaspora Hero Video v3',type:'Video',owner:'Content Director',status:'Approved',due:'2026-06-29'},{id:'A2',name:'Fortress Landing Page',type:'Landing Page',owner:'Digital Marketer',status:'Live',due:'2026-06-30'},{id:'A3',name:'Realtor Sales Kit',type:'PDF Kit',owner:'Sales Manager',status:'Review',due:'2026-07-14'}],
    decisions:[{id:'D1',date:'2026-07-07',decision:'Prioritise UK and Canada audiences; reduce Germany budget.',owner:'Marketing Manager',approver:'CEO',reason:'Higher qualified-lead rate and lower CPL.'}],
    risksLog:[{id:'R1',title:'Slow weekend response',severity:'High',owner:'CSRC Lead',status:'Open',mitigation:'Weekend rota and escalation after 15 minutes.'}],
    updates:[{id:'U1',date:'2026-07-13',author:'Digital Marketer',type:'Progress',text:'UK ad set is 31% below target CPL. Canada creative needs a new testimonial angle.',blocker:'Awaiting approved client testimonial.'}],
    postAnalysis:null
  }
  const c2 = {
    id:'CMP-2402',name:'Benji Enugu Vendor Growth Campaign',type:'Acquisition',brand:'Benji Express',div:'ben',priority:'Medium',
    objective:'Vendor Acquisition',goal:'Onboard active restaurants, supermarkets and pharmacies in Enugu.',description:'Field and digital vendor acquisition campaign linked to vendor onboarding.',
    owner:'Benji Growth Lead',sponsor:'COO',timezone:'Africa/Lagos',start:'2026-07-15',end:'2026-09-15',status:'Planned',
    audience:'Retail and food business owners in Enugu.',locations:'Enugu metropolis',demographics:'Business owners and managers',painPoints:'Low online visibility, delivery complexity and order management.',
    product:'Benji Vendor Platform',funnelStage:'Awareness → Registration',offer:'Free onboarding support and launch visibility.',valueProp:'Reach more customers and manage orders through one platform.',cta:'Register as Vendor',destination:'Vendor Landing Page',
    channels:['Meta Ads','TikTok Ads','Field Activation','Vendor Collaboration','WhatsApp'],budget:3000000,spent:350000,revenue:0,leads:38,qualified:21,bookings:12,customers:5,
    budgetLines:{media:1000000,creative:350000,partners:300000,offline:900000,tools:150000,contingency:300000},
    landing:'go.benjiexpress.com/vendor',leadForm:'Benji Vendor Registration',thankYou:'Onboarding booking page',whatsapp:'Benji Vendor Support',sla:'30 minutes',qualificationOwner:'Benji CRM',handoff:'Qualified business → Vendor onboarding officer',
    utmSource:'mixed',utmMedium:'paid-social-field',utmCampaign:'benji_vendor_growth_enugu',utmContent:'channel_asset',tracking:'Meta Pixel + GA4 + QR codes',events:['ViewContent','Lead','CompleteRegistration'],attribution:'Source + QR code + closing officer',
    keyMessages:'Get more customers; manage orders; delivery support.',deliverables:'Vendor videos, QR flyers, field scripts, onboarding deck, landing page.',offline:'Market visits and business cluster activations.',partners:'Market associations and vendor ambassadors.',salesEnablement:'Demo script, objection guide and onboarding checklist.',assetDue:'2026-07-12',approvers:'Marketing Manager, Benji Operations',
    daci:{driver:'Benji Growth Lead',approver:'COO',contributors:'Digital, Content, Field Sales, Benji Operations',informed:'Finance, Tech'},units:['Digital Marketing','Content & Creative','Sales','Customer Relations'],cadence:'Wednesday growth review',meetingPlatform:'Zoom',approvalChain:'Marketing Manager → Benji Operations → COO',communication:'Daily async update and weekly growth meeting.',
    kpis:{reach:250000,leads:300,qualified:180,bookings:100,customers:80,revenue:0,cpl:10000,cpa:37500,ctr:2,lpcr:10,leadToCustomer:26,roas:0},
    stopRules:'Pause a source after ₦100,000 with fewer than 3 qualified vendors.',scaleRules:'Expand to another business cluster when 15 active vendors are onboarded in the current cluster.',dimensions:'Source, cluster, business type, field officer and activation.',feedback:'Operations confirms onboarding quality and first order within 14 days.',
    risks:'Low-quality registrations, inactive vendors and slow onboarding.',mitigation:'Business verification, onboarding SLA and first-order activation plan.',compliance:['Consent configured','Claims verified','Brand approval'],
    readiness:['Campaign brief approved','Budget approved','Audience and offer validated','Landing page or destination ready','Lead form and consent tested','Tracking, UTM and conversion events tested','Creatives approved','Sales and CSRC briefing completed','Lead assignment and SLA configured','Partners, vendors and media booked','Risk and compliance review completed','Launch and reporting schedule confirmed'].map((x,i)=>({name:x,done:i<7})),
    tasks:[{id:'BT1',title:'Approve vendor launch offer',owner:'COO',due:'2026-07-14',status:'Review',priority:'High'},{id:'BT2',title:'Print QR-coded vendor flyers',owner:'Creative Designer',due:'2026-07-15',status:'In Progress',priority:'High'},{id:'BT3',title:'Configure vendor onboarding automation',owner:'Tech Team',due:'2026-07-18',status:'To Do',priority:'High'}],
    metrics:[{date:'2026-07-13',spend:350000,reach:18000,clicks:620,leads:38,qualified:21,bookings:12,customers:5,revenue:0,note:'Pre-launch field test'}],
    expenses:[{id:'BE1',date:'2026-07-10',category:'Print',vendor:'Enugu Print Hub',amount:180000,status:'Paid'},{id:'BE2',date:'2026-07-11',category:'Field Activation',vendor:'Activation Logistics',amount:170000,status:'Approved'}],
    assets:[{id:'BA1',name:'Vendor Recruitment Video',type:'Video',owner:'Content Director',status:'Review',due:'2026-07-14'},{id:'BA2',name:'Vendor QR Flyer',type:'Print',owner:'Creative Designer',status:'In Progress',due:'2026-07-15'}],
    decisions:[],risksLog:[{id:'BR1',title:'Onboarding team capacity',severity:'Medium',owner:'Benji Operations',status:'Open',mitigation:'Cap daily booking slots and add coordinator.'}],updates:[],postAnalysis:null
  }
  return {
    campaigns:[c1,c2],
    requests:[
      {id:'REQ-1',title:'Belgrove Hotel pre-opening awareness',requester:'Hospitality Unit',department:'Hospitality',needed:'2026-08-15',priority:'High',budget:2500000,problem:'Build awareness and pre-opening enquiries.',audience:'Business travellers and diaspora visitors.',product:'Belgrove Hotel & Suites',outcome:'Waitlist and launch bookings',status:'New'},
      {id:'REQ-2',title:'Engineering project showcase series',requester:'Engineering Department',department:'Engineering',needed:'2026-07-31',priority:'Medium',budget:500000,problem:'Improve credibility and generate construction enquiries.',audience:'Property owners and developers.',product:'Engineering & Construction',outcome:'Qualified consultation leads',status:'Under Review'}
    ],
    meetings:[
      {id:'MTG-1',title:'Fortress Diaspora Optimization Review',type:'Live Optimization Review',campaignId:'CMP-2401',date:'2026-07-14',time:'10:00',duration:'45',status:'Upcoming',platform:'Google Meet',link:'',location:'Online',facilitator:'Marketing Manager',recorder:'Digital Marketer',attendees:'Digital, Content, Sales, CSRC, CEO',agenda:'1. Funnel performance\n2. Lead quality feedback\n3. Creative winners and fatigue\n4. Budget shifts\n5. Blockers and decisions',preRead:'Latest performance dashboard and sales objection report',expected:'Approve budget reallocation and new testimonial creative.',attendance:'',minutes:'',decisions:'',actions:[],recording:'',nextMeeting:''},
      {id:'MTG-2',title:'Benji Vendor Campaign Kickoff',type:'Campaign Kickoff',campaignId:'CMP-2402',date:'2026-07-15',time:'09:00',duration:'60',status:'Upcoming',platform:'Zoom',link:'',location:'Hybrid',facilitator:'Benji Growth Lead',recorder:'Marketing Officer',attendees:'Marketing, Benji Operations, Tech, Field Sales',agenda:'Campaign objective, target clusters, offer, funnel, field activation, onboarding SLA and reporting.',preRead:'Campaign brief and market-cluster list',expected:'Confirm launch readiness and owners.',attendance:'',minutes:'',decisions:'',actions:[],recording:'',nextMeeting:''},
      {id:'MTG-3',title:'Weekly Marketing Department Meeting',type:'General Marketing',campaignId:'',date:'2026-07-10',time:'09:00',duration:'60',status:'Completed',platform:'Boardroom + Google Meet',link:'',location:'Bomach Office / Remote',facilitator:'Marketing Manager',recorder:'Marketing Officer',attendees:'All marketing units',agenda:'Targets, lead response, content status, campaign performance, blockers and weekly priorities.',preRead:'Unit reports',expected:'Approve weekly priorities.',attendance:'Marketing Manager, Digital, Content, Sales, CSRC',minutes:'Reviewed revenue gap, lead response and content backlog.',decisions:'All hot leads must have next action; content approvals within 12 hours.',actions:[{id:'MA1',text:'Clear overdue hot leads',owner:'Sales Manager',due:'2026-07-11',status:'Open'},{id:'MA2',text:'Publish revised approval SLA',owner:'Marketing Manager',due:'2026-07-12',status:'Done'}],recording:'',nextMeeting:'2026-07-17'}
    ],
    activity:[
      {id:'ACT-1',type:'Campaign',text:'Fortress campaign performance updated.',campaignId:'CMP-2401',actor:'Digital Marketer',time:'7/13/2026, 4:30 PM'},
      {id:'ACT-2',type:'Meeting',text:'Weekly marketing meeting minutes completed.',campaignId:'',actor:'Marketing Officer',time:'7/10/2026, 11:00 AM'}
    ]
  }
}
